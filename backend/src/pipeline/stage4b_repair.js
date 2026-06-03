const { callClaudeJSON } = require('../utils/claudeClient');
const { info, warn } = require('../utils/logger');
const { AppConfigSchema, DbSchema, ApiSchema, UiSchema } = require('../schemas/appConfigSchema');
const { validateAppConfig, getLayerSchema } = require('./stage4_validation');

const LAYER_SCHEMA_MAP = {
  db: DbSchema,
  api: ApiSchema,
  ui: UiSchema,
};

const REPAIR_SYSTEM_PROMPT = `
You are stage 4b of a compiler-style app generation pipeline.
Repair ONLY the issues listed for the target layer.

Rules:
- Return JSON only.
- Modify only the target layer schema.
- Keep other layers unchanged.
- Use the other two schemas as ground truth.
- Fix only the listed issues; do not introduce unrelated changes.
`.trim();

function getRepairSchema(layer) {
  return LAYER_SCHEMA_MAP[layer] || null;
}

async function repairLayerSchema({ layer, currentSchema, otherSchemas, issues, options = {} }) {
  info('stage4b_repair', `repairing ${layer} layer`);

  const response = await callClaudeJSON(
    REPAIR_SYSTEM_PROMPT,
    JSON.stringify(
      {
        layer,
        issues,
        current_schema: currentSchema,
        other_schemas: otherSchemas,
      },
      null,
      2
    ),
    options.maxTokens || 2048,
    {
      model: options.model,
      apiUrl: options.apiUrl,
    }
  );

  if (!response.success) {
    return response;
  }

  const schema = getRepairSchema(layer);
  const parsed = schema ? schema.safeParse(response.data) : AppConfigSchema.safeParse(response.data);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      raw: response.raw,
      error: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; '),
    };
  }

  return {
    success: true,
    data: parsed.data,
    raw: response.raw,
  };
}

function groupIssuesByLayer(issues) {
  return issues.reduce((accumulator, currentIssue) => {
    if (!accumulator[currentIssue.layer]) {
      accumulator[currentIssue.layer] = [];
    }
    accumulator[currentIssue.layer].push(currentIssue);
    return accumulator;
  }, {});
}

async function repairValidationCycles(appConfig, options = {}) {
  let current = JSON.parse(JSON.stringify(appConfig));
  let lastValidation = validateAppConfig(current);
  const cycleReports = [];

  for (let cycle = 1; cycle <= 3; cycle += 1) {
    if (lastValidation.valid) {
      break;
    }

    const issuesByLayer = groupIssuesByLayer(lastValidation.issues.filter((issue) => issue.severity === 'error'));
    const repairedLayers = [];

    for (const layer of ['db', 'api', 'ui']) {
      const layerIssues = issuesByLayer[layer] || [];
      if (!layerIssues.length) {
        continue;
      }

      const currentSchema = getLayerSchema(current, layer);
      const otherSchemas = {
        db: layer === 'db' ? undefined : current.db,
        api: layer === 'api' ? undefined : current.api,
        ui: layer === 'ui' ? undefined : current.ui,
        auth: current.auth,
      };

      const repaired = await repairLayerSchema({
        layer,
        currentSchema,
        otherSchemas,
        issues: layerIssues,
        options,
      });

      if (repaired.success) {
        current[layer] = repaired.data;
        repairedLayers.push(layer);
      } else {
        warn('stage4b_repair', `failed to repair ${layer} layer`, { error: repaired.error });
      }
    }

    lastValidation = validateAppConfig(current);
    cycleReports.push({
      cycle,
      repairedLayers,
      valid: lastValidation.valid,
      issueCount: lastValidation.issues.length,
    });
  }

  const finalValidation = validateAppConfig(current);
  return {
    success: true,
    data: current,
    validation: finalValidation,
    cycles: cycleReports,
  };
}

module.exports = {
  repairLayerSchema,
  repairValidationCycles,
  REPAIR_SYSTEM_PROMPT,
};
