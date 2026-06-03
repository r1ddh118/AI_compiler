const { IntentSchema } = require('../schemas/intentSchema');
const { callClaudeJSON } = require('../utils/claudeClient');
const { info } = require('../utils/logger');

const INTENT_SYSTEM_PROMPT = `
You are stage 1 of a compiler-style app generation pipeline.
Convert natural language into grounded intent JSON.

Rules:
- Return JSON only.
- Do not invent features not present in the input.
- Capture missing details as open_questions.
- Keep output execution-aware for downstream schema and runtime stages.
`.trim();

async function extractIntent(userRequest, options = {}) {
  info('stage1_intent', 'extracting intent');

  const response = await callClaudeJSON(
    INTENT_SYSTEM_PROMPT,
    userRequest,
    options.maxTokens || 2048,
    {
      model: options.model,
      apiUrl: options.apiUrl,
    }
  );

  if (!response.success) {
    return response;
  }

  const parsed = IntentSchema.safeParse(response.data);
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
  extractIntent,
  INTENT_SYSTEM_PROMPT,
};
