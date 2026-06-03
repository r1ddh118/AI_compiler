const { ArchitectureSchema } = require('../schemas/architectureSchema');
const { callClaudeJSON } = require('../utils/claudeClient');
const { info } = require('../utils/logger');

const ARCHITECTURE_SYSTEM_PROMPT = `
You are stage 2 of a compiler-style app generation pipeline.
Convert grounded intent into architecture JSON.

Rules:
- Return JSON only.
- Preserve intent constraints.
- Organize the app into services, API surfaces, data flow, and UI structure.
`.trim();

async function deriveArchitecture(intent, options = {}) {
  info('stage2_architecture', 'deriving architecture');

  const response = await callClaudeJSON(
    ARCHITECTURE_SYSTEM_PROMPT,
    JSON.stringify(intent, null, 2),
    options.maxTokens || 2048,
    {
      model: options.model,
      apiUrl: options.apiUrl,
    }
  );

  if (!response.success) {
    return response;
  }

  const parsed = ArchitectureSchema.safeParse(response.data);
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
  deriveArchitecture,
  ARCHITECTURE_SYSTEM_PROMPT,
};
