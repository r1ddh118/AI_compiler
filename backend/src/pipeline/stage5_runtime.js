const fs = require('fs');
const path = require('path');
const { info } = require('../utils/logger');
const { generateCodeBundle } = require('../../../runtime/codeGenerator');
const { extractIntent } = require('./stage1_intent');
const { deriveArchitecture } = require('./stage2_architecture');
const { deriveSchemaConfig } = require('./stage3_schema');
const { deriveAuthAndBusinessLogic } = require('./stage3b_auth');
const { validateAppConfig } = require('./stage4_validation');
const { repairValidationCycles } = require('./stage4b_repair');

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function renderExpressRoutesCode(apiSchema) {
  return generateCodeBundle({ api: apiSchema, db: { tables: [] } }).expressRoutesCode;
}

function renderDrizzleSchemaCode(dbSchema) {
  return generateCodeBundle({ api: { endpoints: [] }, db: dbSchema }).drizzleSchemaCode;
}

function renderRuntimeFiles(appConfig) {
  const codeBundle = generateCodeBundle(appConfig);
  const generatedFiles = [
    'spec/app-config.json',
    'runtime/expressRoutes.js',
    'runtime/drizzleSchema.ts',
  ];

  return {
    generatedFiles,
    expressRoutesCode: codeBundle.expressRoutesCode,
    drizzleSchemaCode: codeBundle.drizzleSchemaCode,
    fileContents: {
      'spec/app-config.json': `${JSON.stringify(appConfig, null, 2)}\n`,
      'runtime/expressRoutes.js': `${codeBundle.expressRoutesCode}\n`,
      'runtime/drizzleSchema.ts': `${codeBundle.drizzleSchemaCode}\n`,
    },
  };
}

function simulateRuntime(appConfig, outputDir = path.join(process.cwd(), 'generated-app')) {
  info('stage5_runtime', 'simulating runtime');

  const runtime = renderRuntimeFiles(appConfig);
  for (const [relativePath, content] of Object.entries(runtime.fileContents)) {
    writeFile(path.join(outputDir, relativePath), content);
  }

  return {
    success: true,
    outputDir,
    generated_files: runtime.generatedFiles.map((filePath) => path.join(outputDir, filePath)),
    express_routes_code: runtime.expressRoutesCode,
    drizzle_schema_code: runtime.drizzleSchemaCode,
  };
}

async function compileApplication(userRequest, options = {}) {
  const intentResult = await extractIntent(userRequest, options);
  if (!intentResult.success) {
    return { stage: 'intent', ...intentResult };
  }

  const architectureResult = await deriveArchitecture(intentResult.data, options);
  if (!architectureResult.success) {
    return { stage: 'architecture', intent: intentResult.data, ...architectureResult };
  }

  const schemaResult = await deriveSchemaConfig(intentResult.data, architectureResult.data, options);
  if (!schemaResult.success) {
    return {
      stage: 'schema',
      intent: intentResult.data,
      architecture: architectureResult.data,
      ...schemaResult,
    };
  }

  const authResult = await deriveAuthAndBusinessLogic(
    {
      intent: intentResult.data,
      architecture: architectureResult.data,
      schema: schemaResult.data,
    },
    options
  );

  if (!authResult.success) {
    return {
      stage: 'auth',
      intent: intentResult.data,
      architecture: architectureResult.data,
      schema: schemaResult.data,
      ...authResult,
    };
  }

  const baseAppConfig = {
    app_name: intentResult.data.app_name,
    intent: intentResult.data,
    architecture: architectureResult.data,
    db: schemaResult.data.db,
    api: schemaResult.data.api,
    ui: schemaResult.data.ui,
    auth: authResult.data,
    validation: {
      passed: false,
      issues: [],
      warnings: [],
      report: {},
    },
    runtime: {
      entrypoint: 'runtime/expressRoutes.js',
      generated_files: [],
      instructions: [
        'Generate Express routes from api.endpoints',
        'Generate Drizzle ORM schema from db.tables',
        'Bind UI api_endpoint references to API endpoint ids or METHOD /path values',
      ],
      express_routes_code: '',
      drizzle_schema_code: '',
    },
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  let validationResult = validateAppConfig(baseAppConfig);
  let finalAppConfig = validationResult.data || baseAppConfig;
  let retryCount = 0;

  if (!validationResult.valid) {
    const repaired = await repairValidationCycles(baseAppConfig, options);
    finalAppConfig = repaired.data;
    validationResult = repaired.validation;
    retryCount = Array.isArray(repaired.cycles) ? repaired.cycles.length : 0;
  }

  if (!validationResult.valid) {
    return {
      success: false,
      stage: 'validation',
      intent: intentResult.data,
      architecture: architectureResult.data,
      schema: schemaResult.data,
      auth: authResult.data,
      validation: validationResult,
      appConfig: finalAppConfig,
    };
  }

  const runtimeResult = simulateRuntime(finalAppConfig, options.outputDir);

  finalAppConfig.runtime = {
    ...finalAppConfig.runtime,
    generated_files: runtimeResult.generated_files,
    express_routes_code: runtimeResult.express_routes_code,
    drizzle_schema_code: runtimeResult.drizzle_schema_code,
  };
  finalAppConfig.validation = {
    passed: true,
    issues: validationResult.issues || [],
    warnings: validationResult.warnings || [],
    report: validationResult.report || {},
  };

  return {
    success: true,
    stage: 'complete',
    intent: intentResult.data,
    architecture: architectureResult.data,
    schema: schemaResult.data,
    auth: authResult.data,
    appConfig: finalAppConfig,
    validation: validationResult,
    retryCount,
    runtime: runtimeResult,
  };
}

module.exports = {
  simulateRuntime,
  compileApplication,
  renderExpressRoutesCode,
  renderDrizzleSchemaCode,
};
