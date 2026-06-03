const { AppConfigSchema, DbSchema, ApiSchema, UiSchema, AuthSchema, ValidationIssueSchema } = require('../schemas/appConfigSchema');
const { info } = require('../utils/logger');

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function isSensitiveField(fieldName) {
  const normalized = normalizeName(fieldName);
  return normalized.includes('password') || normalized.includes('token');
}

function issue(type, severity, layer, detail, fixHint) {
  return {
    type,
    severity,
    layer,
    detail,
    fix_hint: fixHint,
  };
}

function buildTableIndex(dbSchema) {
  const index = new Map();
  for (const table of dbSchema.tables || []) {
    index.set(normalizeName(table.name), table);
  }
  return index;
}

function buildApiIndex(apiSchema) {
  const byId = new Map();
  const byMethodPath = new Map();
  for (const endpoint of apiSchema.endpoints || []) {
    byId.set(normalizeName(endpoint.id), endpoint);
    byMethodPath.set(normalizeName(`${endpoint.method} ${endpoint.path}`), endpoint);
  }
  return { byId, byMethodPath };
}

function getEndpointMatch(apiSchema, apiEndpointValue) {
  const { byId, byMethodPath } = buildApiIndex(apiSchema);
  return byId.get(normalizeName(apiEndpointValue)) || byMethodPath.get(normalizeName(apiEndpointValue)) || null;
}

function getLayerSchema(appConfig, layer) {
  if (layer === 'db') return appConfig.db;
  if (layer === 'api') return appConfig.api;
  if (layer === 'ui') return appConfig.ui;
  return null;
}

function validateLayerSchemas(appConfig) {
  const layerResults = {
    db: DbSchema.safeParse(appConfig.db),
    api: ApiSchema.safeParse(appConfig.api),
    ui: UiSchema.safeParse(appConfig.ui),
    auth: AuthSchema.safeParse(appConfig.auth),
  };

  const layerIssues = [];
  for (const [layer, result] of Object.entries(layerResults)) {
    if (!result.success) {
      layerIssues.push(
        ...result.error.issues.map((zodIssue) =>
          issue(
            'schema_validation',
            'error',
            layer === 'auth' ? 'api' : layer,
            `${layer}.${zodIssue.path.join('.') || 'root'}: ${zodIssue.message}`,
            `Repair the ${layer} schema to satisfy its Zod contract.`
          )
        )
      );
    }
  }

  return { layerResults, layerIssues };
}

function validateCrossLayer(appConfig) {
  const issues = [];
  const tableIndex = buildTableIndex(appConfig.db);
  const { byId, byMethodPath } = buildApiIndex(appConfig.api);
  const authRoles = new Set((appConfig.auth.roles || []).map(normalizeName));

  for (const endpoint of appConfig.api.endpoints || []) {
    const responseTableName = endpoint?.response?.ref;
    const responseTable = tableIndex.get(normalizeName(responseTableName));

    if (!responseTable) {
      issues.push(
        issue(
          'missing_response_table',
          'error',
          'db',
          `API endpoint "${endpoint.id}" response.ref "${responseTableName}" does not match any DB table.`,
          `Set response.ref to one of: ${appConfig.db.tables.map((table) => table.name).join(', ') || 'an existing DB table'}`
        )
      );
      continue;
    }

    const tableFields = new Map((responseTable.columns || []).map((column) => [normalizeName(column.name), column]));
    for (const requestField of endpoint.request_body?.fields || []) {
      if (isSensitiveField(requestField.name)) {
        continue;
      }

      if (!tableFields.has(normalizeName(requestField.name))) {
        issues.push(
          issue(
            'request_field_missing_in_table',
            'error',
            'api',
            `API endpoint "${endpoint.id}" request body field "${requestField.name}" is not present in DB table "${responseTable.name}".`,
            `Add "${requestField.name}" to DB table "${responseTable.name}" or remove it from the request body schema.`
          )
        );
      }
    }

    for (const role of endpoint.auth_roles || []) {
      if (!authRoles.has(normalizeName(role))) {
        issues.push(
          issue(
            'missing_auth_role',
            'error',
            'api',
            `API endpoint "${endpoint.id}" references auth role "${role}" that does not exist in auth config.`,
            `Add "${role}" to auth.roles or remove it from API endpoint "${endpoint.id}".`
          )
        );
      }
    }
  }

  for (const component of appConfig.ui.components || []) {
    const matchedEndpoint = getEndpointMatch(appConfig.api, component.api_endpoint);
    if (!matchedEndpoint) {
      issues.push(
        issue(
          'missing_api_endpoint_reference',
          'error',
          'ui',
          `UI component "${component.id}" api_endpoint "${component.api_endpoint}" does not match an API endpoint id or METHOD /path.`,
          `Point api_endpoint to an API endpoint id or exact method/path like "POST /users".`
        )
      );
      continue;
    }

    const isForm = normalizeName(component.type).includes('form');
    if (isForm) {
      const requestFields = new Set((matchedEndpoint.request_body?.fields || []).map((field) => normalizeName(field.name)));
      for (const field of component.fields || []) {
        if (!requestFields.has(normalizeName(field.name))) {
          issues.push(
            issue(
              'ui_form_field_mismatch',
              'error',
              'ui',
              `UI form component "${component.id}" field "${field.name}" is not present in API endpoint "${matchedEndpoint.id}" request body schema.`,
              `Align the form field "${field.name}" with request_body.fields on endpoint "${matchedEndpoint.id}".`
            )
          );
        }
      }
    }
  }

  return issues;
}

function validateAppConfig(appConfig) {
  info('stage4_validation', 'validating app config');

  const parsed = AppConfigSchema.safeParse(appConfig);
  if (!parsed.success) {
    return {
      success: false,
      valid: false,
      issues: parsed.error.issues.map((zodIssue) =>
        issue(
          'app_config_schema_invalid',
          'error',
          'api',
          `appConfig.${zodIssue.path.join('.') || 'root'}: ${zodIssue.message}`,
          'Fix the JSON shape so it matches the app configuration schema.'
        )
      ),
      warnings: [],
      report: {
        layer_validation: null,
        cross_layer: [],
        zod_errors: parsed.error.issues,
      },
      data: null,
    };
  }

  const { layerResults, layerIssues } = validateLayerSchemas(parsed.data);
  const crossLayerIssues = validateCrossLayer(parsed.data);
  const allIssues = [...layerIssues, ...crossLayerIssues];
  const warnings = allIssues.filter((item) => item.severity === 'warning');

  return {
    success: true,
    valid: allIssues.filter((item) => item.severity === 'error').length === 0,
    issues: allIssues,
    warnings,
    report: {
      layer_validation: {
        db: layerResults.db.success,
        api: layerResults.api.success,
        ui: layerResults.ui.success,
        auth: layerResults.auth.success,
      },
      cross_layer: crossLayerIssues,
    },
    data: {
      ...parsed.data,
      validation: {
        passed: allIssues.filter((item) => item.severity === 'error').length === 0,
        issues: allIssues,
        warnings,
        report: {
          layer_validation: {
            db: layerResults.db.success,
            api: layerResults.api.success,
            ui: layerResults.ui.success,
            auth: layerResults.auth.success,
          },
          cross_layer: crossLayerIssues,
        },
      },
    },
  };
}

module.exports = {
  validateAppConfig,
  validateCrossLayer,
  validateLayerSchemas,
  getEndpointMatch,
  normalizeName,
  isSensitiveField,
  ValidationIssueSchema,
  issue,
  getLayerSchema,
};
