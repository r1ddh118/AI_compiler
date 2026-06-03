const fs = require('fs');
const path = require('path');
const { info, warn } = require('../utils/logger');
const { extractIntent } = require('./stage1_intent');
const { deriveArchitecture } = require('./stage2_architecture');
const { deriveSchemaConfig } = require('./stage3_schema');
const { deriveAuthAndBusinessLogic } = require('./stage3b_auth');
const { validateAppConfig } = require('./stage4_validation');
const { repairAppConfig } = require('./stage4b_repair');

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function renderRuntimeFiles(appConfig) {
  const generatedFiles = [
    'spec/app-config.json',
    'runtime/README.md',
    'db/schema.json',
    'api/routes.md',
    'ui/pages.md',
  ];

  return {
    generatedFiles,
    fileContents: {
      'spec/app-config.json': `${JSON.stringify(appConfig, null, 2)}\n`,
      'runtime/README.md': `# Runtime Simulation\n\nThis app spec can scaffold:\n- database tables\n- API endpoints\n- UI pages\n`,
      'db/schema.json': `${JSON.stringify(appConfig.schema, null, 2)}\n`,
      'api/routes.md': `${appConfig.architecture.api_surface.map((route) => `- ${route.resource}: ${route.methods.join(', ')}`).join('\n') || '- no routes'}\n`,
      'ui/pages.md': `${appConfig.intent.ui_pages.map((page) => `- ${page}`).join('\n') || '- no pages'}\n`,
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

  const schemaResult = await deriveSchemaConfig(architectureResult.data, options);
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
    schema: schemaResult.data,
    auth: authResult.data,
    validation: {
      passed: false,
      issues: [],
      warnings: [],
    },
    runtime: {
      entrypoint: 'runtime/README.md',
      generated_files: [],
      instructions: [
        'Create database tables from schema.tables',
        'Generate API handlers from architecture.api_surface',
        'Render UI pages from intent.ui_pages',
      ],
    },
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  let validationResult = validateAppConfig(baseAppConfig);
  let finalAppConfig = validationResult.data || baseAppConfig;

  if (!validationResult.valid) {
    warn('stage5_runtime', 'validation failed, attempting repair');
    const repaired = await repairAppConfig(
      {
        appConfig: baseAppConfig,
        issues: validationResult.issues,
        warnings: validationResult.warnings,
      },
      options
    );

    if (repaired.success) {
      finalAppConfig = repaired.data;
      validationResult = validateAppConfig(finalAppConfig);
      if (validationResult.data) {
        finalAppConfig = validationResult.data;
      }
    }
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
  };
  finalAppConfig.validation = {
    passed: true,
    issues: validationResult.issues || [],
    warnings: validationResult.warnings || [],
  };

  return {
    success: true,
    stage: 'complete',
    intent: intentResult.data,
    architecture: architectureResult.data,
    schema: schemaResult.data,
    auth: authResult.data,
    appConfig: finalAppConfig,
    runtime: runtimeResult,
  };
}

module.exports = {
  simulateRuntime,
  compileApplication,
};
