const { z } = require('zod');
const { callClaudeJSON } = require('../utils/claudeClient');
const { info } = require('../utils/logger');
const {
  ApiSchema,
  DbSchema,
  UiSchema,
} = require('../schemas/appConfigSchema');

const DB_SYSTEM_PROMPT = `
You are stage 3a of a compiler-style app generation pipeline.
Generate a database schema JSON object only.

Rules:
- Return JSON only.
- Create tables, columns, primary keys, and foreign keys grounded in the intent and architecture.
- Keep names execution-friendly and consistent.
`.trim();

const API_SYSTEM_PROMPT = `
You are stage 3b of a compiler-style app generation pipeline.
Generate an API schema JSON object only.

Rules:
- Return JSON only.
- Each endpoint must include id, method, path, response.ref, request_body.fields, and auth_roles.
- response.ref must point to a real DB table name.
- request_body.fields should align with the DB table used by the endpoint.
`.trim();

const UI_SYSTEM_PROMPT = `
You are stage 3c of a compiler-style app generation pipeline.
Generate a UI schema JSON object only.

Rules:
- Return JSON only.
- Each UI component must include api_endpoint and form fields when applicable.
- api_endpoint must reference a real API endpoint by endpoint id or by METHOD /path.
`.trim();

function parseAndValidate(schema, value, label, raw) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      raw,
      error: parsed.error.issues.map((issue) => `${label}.${issue.path.join('.') || 'root'}: ${issue.message}`).join('; '),
    };
  }

  return {
    success: true,
    data: parsed.data,
    raw,
  };
}

async function generateLayerSchema(systemPrompt, payload, schema, label, options = {}) {
  const response = await callClaudeJSON(
    systemPrompt,
    JSON.stringify(payload, null, 2),
    options.maxTokens || 2048,
    {
      model: options.model,
      apiUrl: options.apiUrl,
    }
  );

  if (!response.success) {
    return response;
  }

  return parseAndValidate(schema, response.data, label, response.raw);
}

async function deriveSchemaConfig(intent, architecture, options = {}) {
  info('stage3_schema', 'generating db/api/ui schemas in parallel');

  const payload = {
    intent,
    architecture,
  };

  const [dbResult, apiResult, uiResult] = await Promise.all([
    generateLayerSchema(DB_SYSTEM_PROMPT, payload, DbSchema, 'db', options),
    generateLayerSchema(API_SYSTEM_PROMPT, payload, ApiSchema, 'api', options),
    generateLayerSchema(UI_SYSTEM_PROMPT, payload, UiSchema, 'ui', options),
  ]);

  if (!dbResult.success) {
    return { success: false, stage: 'db', ...dbResult };
  }

  if (!apiResult.success) {
    return { success: false, stage: 'api', ...apiResult };
  }

  if (!uiResult.success) {
    return { success: false, stage: 'ui', ...uiResult };
  }

  return {
    success: true,
    data: {
      db: dbResult.data,
      api: apiResult.data,
      ui: uiResult.data,
    },
    raw: {
      db: dbResult.raw,
      api: apiResult.raw,
      ui: uiResult.raw,
    },
  };
}

module.exports = {
  deriveSchemaConfig,
  DB_SYSTEM_PROMPT,
  API_SYSTEM_PROMPT,
  UI_SYSTEM_PROMPT,
};
