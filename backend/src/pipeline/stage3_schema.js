const { callClaudeJSON } = require('../utils/claudeClient');
const { info } = require('../utils/logger');
const { z } = require('zod');

const SchemaConfigSchema = z.object({
  app_name: z.string().min(1),
  tables: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      columns: z.array(
        z.object({
          name: z.string().min(1),
          type: z.string().min(1),
          required: z.boolean(),
          description: z.string().min(1),
        })
      ).default([]),
      primary_key: z.string().min(1),
      foreign_keys: z.array(z.string()).default([]),
    })
  ).default([]),
  indexes: z.array(z.string()).default([]),
  validation_rules: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

const SCHEMA_SYSTEM_PROMPT = `
You are stage 3 of a compiler-style app generation pipeline.
Generate an execution-friendly schema configuration from the architecture JSON.

Rules:
- Return JSON only.
- Create consistent tables, columns, relationships, indexes, and validation rules.
- Do not add unrelated tables.
`.trim();

async function deriveSchemaConfig(architecture, options = {}) {
  info('stage3_schema', 'deriving schema');

  const response = await callClaudeJSON(
    SCHEMA_SYSTEM_PROMPT,
    JSON.stringify(architecture, null, 2),
    options.maxTokens || 2048,
    {
      model: options.model,
      apiUrl: options.apiUrl,
    }
  );

  if (!response.success) {
    return response;
  }

  const parsed = SchemaConfigSchema.safeParse(response.data);
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

module.exports = {
  deriveSchemaConfig,
  SchemaConfigSchema,
};
