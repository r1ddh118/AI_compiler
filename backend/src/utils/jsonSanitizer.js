function stripCodeFences(text) {
  return String(text)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractLikelyJson(text) {
  const cleaned = stripCodeFences(text);
  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  const start = firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  if (start === -1) {
    return cleaned;
  }

  const endObject = cleaned.lastIndexOf('}');
  const endArray = cleaned.lastIndexOf(']');
  const end = Math.max(endObject, endArray);
  if (end === -1 || end <= start) {
    return cleaned.slice(start);
  }

  return cleaned.slice(start, end + 1);
}

function safeParseJson(text) {
  const candidate = extractLikelyJson(text);
  return JSON.parse(candidate);
}

module.exports = {
  stripCodeFences,
  extractLikelyJson,
  safeParseJson,
};
