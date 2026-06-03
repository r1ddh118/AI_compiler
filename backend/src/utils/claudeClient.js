require('dotenv').config();

const axios = require('axios');
const { stripCodeFences } = require('./jsonSanitizer');

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4';
const DEFAULT_API_URL = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function buildClaudeHeaders() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY in environment.');
  }

  return {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': process.env.ANTHROPIC_API_VERSION || '2023-06-01',
    'content-type': 'application/json',
  };
}

async function callClaude(systemPrompt, userMessage, maxTokens = 4096, temperature = 0.1, options = {}) {
  const response = await axios.post(
    options.apiUrl || DEFAULT_API_URL,
    {
      model: options.model || DEFAULT_MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: buildClaudeHeaders(),
      timeout: Number(process.env.ANTHROPIC_TIMEOUT_MS || 120000),
    }
  );

  const content = response?.data?.content;
  if (!Array.isArray(content) || !content[0] || typeof content[0].text !== 'string') {
    throw new Error('Claude returned an unexpected response format.');
  }

  return content[0].text;
}

async function callClaudeJSON(systemPrompt, userMessage, maxTokens = 4096, options = {}) {
  try {
    const raw = await callClaude(systemPrompt, userMessage, maxTokens, 0.1, options);
    const cleaned = stripCodeFences(raw);
    return {
      success: true,
      data: JSON.parse(cleaned),
      raw,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      raw: error?.response?.data ? JSON.stringify(error.response.data) : undefined,
      error: error.message,
    };
  }
}

module.exports = {
  callClaude,
  callClaudeJSON,
};
