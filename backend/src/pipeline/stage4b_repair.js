const { callClaudeJSON } = require('../utils/claudeClient');
const { AppConfigSchema } = require('../schemas/appConfigSchema');
const { info } = require('../utils/logger');

const REPAIR_SYSTEM_PROMPT = `
You are stage 4b of a compiler-style app generation pipeline.
Repair invalid app config JSON using the provided validation issues.

Rules:
- Return JSON only.
- Preserve as much of the original config as possible.
- Fix structural issues and keep the output aligned with prior stages.
`.trim();

async function repairAppConfig(payload, options = {}) {
  info('stage4b_repair', 'repairing app config');

  const response = await callClaudeJSON(
    REPAIR_SYSTEM_PROMPT,
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

  const parsed = AppConfigSchema.safeParse(response.data);
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
  repairAppConfig,
};
