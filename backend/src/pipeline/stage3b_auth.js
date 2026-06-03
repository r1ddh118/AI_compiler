const { callClaudeJSON } = require('../utils/claudeClient');
const { info } = require('../utils/logger');
const { z } = require('zod');

const AuthConfigSchema = z.object({
  auth_model: z.string().min(1),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  business_rules: z.array(z.string()).default([]),
});

const AUTH_SYSTEM_PROMPT = `
You are stage 3b of a compiler-style app generation pipeline.
Derive auth and business logic from the intent, architecture, and schema.

Rules:
- Return JSON only.
- Keep roles, permissions, and business rules grounded in prior stages.
`.trim();

async function deriveAuthAndBusinessLogic(payload, options = {}) {
  info('stage3b_auth', 'deriving auth and business logic');

  const response = await callClaudeJSON(
    AUTH_SYSTEM_PROMPT,
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

  const parsed = AuthConfigSchema.safeParse(response.data);
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
  deriveAuthAndBusinessLogic,
  AuthConfigSchema,
};
