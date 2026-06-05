require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { info, error } = require('./utils/logger');
const { compileApplication } = require('./pipeline/stage5');

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length
      ? allowedOrigins
      : true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.send(
    'AI Compiler backend is running. Use /health for health checks and POST /api/generate to compile prompts.'
  );
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/generate', async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }

    info('api_generate', 'starting pipeline');
    const result = await compileApplication(prompt, { outputDir: req.body?.outputDir });
    return res.status(result.success ? 200 : 422).json(result);
  } catch (err) {
    error('api_generate', 'pipeline failed', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  info('server', `listening on port ${port}`);
});
