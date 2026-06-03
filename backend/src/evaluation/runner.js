const { dataset } = require('./dataset');
const { compileApplication } = require('../pipeline/stage5_runtime');

async function runEvaluation(options = {}) {
  const results = [];

  for (const prompt of dataset) {
    const result = await compileApplication(prompt, options);
    results.push({
      prompt,
      success: Boolean(result.success),
      stage: result.stage,
      hasAppConfig: Boolean(result.appConfig),
    });
  }

  const successCount = results.filter((item) => item.success).length;
  return {
    total: results.length,
    successCount,
    successRate: results.length ? successCount / results.length : 0,
    results,
  };
}

module.exports = {
  runEvaluation,
};
