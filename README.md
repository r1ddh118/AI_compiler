# AI Compiler

AI Compiler is a multi-stage “compiler” for app generation:

- **Input**: natural language product descriptions
- **Output**: validated JSON app configuration plus generated runtime code

It follows the same idea as a compiler:

- **Lexer / intent extraction** → `stage1_intent`
- **Parser / system design** → `stage2_architecture`
- **Code generation / schema creation** → `stage3_schema`
- **Validation / repair** → `stage4_validation` and `stage4b_repair`
- **Runtime simulation** → `stage5_runtime`

## Architecture

### Backend

The backend is a Node.js + Express service that:

- calls Claude with strict JSON-only prompts
- builds an app spec in multiple stages
- validates cross-layer consistency
- repairs invalid layers up to 3 cycles
- generates runtime code strings for Express routes and Drizzle ORM schema

Main entrypoint:

- `backend/src/index.js`

### Frontend

The frontend is a Vite + React app that:

- sends prompts to the backend
- visualizes pipeline stages
- shows generated schemas and runtime code
- surfaces validation and runtime metrics

Main entrypoint:

- `frontend/src/main.tsx`

### Runtime code generation

The runtime generator:

- consumes the final JSON app config
- emits Express route code
- emits Drizzle ORM schema code

File:

- `runtime/codeGenerator.js`

## Run locally

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Full local setup

1. Start the backend on `http://localhost:3001`
2. Start the frontend on the Vite dev server
3. Set `VITE_API_URL` in the frontend environment to the backend URL if needed

## Environment variables

### Backend

Create `backend/.env` from `backend/.env.example`.

Required:

- `ANTHROPIC_API_KEY`

Recommended:

- `ANTHROPIC_MODEL=claude-sonnet-4`
- `ANTHROPIC_API_URL=https://api.anthropic.com/v1/messages`
- `ANTHROPIC_API_VERSION=2023-06-01`
- `ANTHROPIC_TIMEOUT_MS=120000`
- `PORT=3001`
- `CORS_ORIGIN` or `FRONTEND_URL` for allowed frontend origins

### Frontend

Set:

- `VITE_API_URL`

Example:

```bash
VITE_API_URL=https://your-railway-backend.up.railway.app
```

## Evaluation framework

The evaluation runner lives in:

- `backend/src/evaluation/dataset.js`
- `backend/src/evaluation/runner.js`

It:

- runs the full pipeline for each prompt
- records success/failure
- tracks latency, retries, validation issues, failure stage, and generated object counts
- writes:
  - `backend/evaluation/results.json`
  - `backend/evaluation/report.md`

Run it with:

```bash
cd backend
npm run eval
```

## Example inputs and outputs

### Example input

```text
Build a CRM for a small sales team with lead tracking, contact management, follow-up reminders, and role-based access.
```

### Example output

The backend returns a final app config containing:

- `db.tables`
- `api.endpoints`
- `ui.pages`
- `auth.roles`
- `validation.issues`
- `runtime.express_routes_code`
- `runtime.drizzle_schema_code`

### Generated runtime

The runtime simulator writes code strings for:

- Express route scaffolding
- Drizzle ORM schema scaffolding

## Railway deployment

### Backend service

Use the `backend/Procfile`:

```bash
web: npm start
```

Make sure Railway injects:

- `PORT`
- `ANTHROPIC_API_KEY`
- `CORS_ORIGIN` or `FRONTEND_URL`

### Frontend service

Use the Vite build settings:

- **Build command**: `npm run build`
- **Output directory**: `dist`

Set frontend env:

- `VITE_API_URL` = Railway backend URL

## Notes

- The backend already listens on `process.env.PORT`.
- The frontend now reads `VITE_API_URL`.
- Cross-origin requests are restricted via `CORS_ORIGIN` / `FRONTEND_URL`.
