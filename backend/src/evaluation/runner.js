const fs = require('fs');
const path = require('path');
const dataset = require('./dataset');
const { compileApplication } = require('../pipeline/stage5_runtime');

const OUTPUT_DIR = path.join(process.cwd(), 'evaluation');
const RESULTS_PATH = path.join(OUTPUT_DIR, 'results.json');
const REPORT_PATH = path.join(OUTPUT_DIR, 'report.md');

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function normalizeDatasetEntries(datasetSource) {
  if (Array.isArray(datasetSource)) {
    return datasetSource.map((entry, index) => ({
      id: entry.id || `prompt-${index + 1}`,
      category: entry.category || 'normal',
      prompt: entry.prompt || String(entry),
    }));
  }

  const normalizedEntries = [];
  const categoryMap = {
    normal: 'normal',
    vague: 'vague',
    edge_cases: 'edge',
    edge: 'edge',
  };

  for (const [categoryKey, prompts] of Object.entries(datasetSource || {})) {
    const category = categoryMap[categoryKey] || categoryKey;
    if (!Array.isArray(prompts)) {
      continue;
    }

    prompts.forEach((prompt, index) => {
      normalizedEntries.push({
        id: `${category}-${index + 1}`,
        category,
        prompt: String(prompt),
      });
    });
  }

  return normalizedEntries;
}

function getValidationIssues(result) {
  const issues = result?.validation?.issues;
  if (Array.isArray(issues)) {
    return issues;
  }
  return [];
}

function getFailureStage(result) {
  if (result?.success) {
    return null;
  }
  return result?.stage || 'unknown';
}

function getErrorType(result, validationIssues) {
  if (result?.error) {
    return 'pipeline_error';
  }

  const firstIssue = validationIssues[0];
  if (firstIssue?.type) {
    return firstIssue.type;
  }

  if (!result?.success) {
    return 'unknown_failure';
  }

  return null;
}

function buildMarkdownReport(runSummary, rows) {
  const categoryRows = Object.entries(runSummary.byCategory).map(([category, stats]) => {
    const successRatePercent = (stats.success_rate * 100).toFixed(1);
    return `| ${category} | ${stats.total} | ${stats.successes} | ${successRatePercent}% | ${stats.avg_latency_ms.toFixed(1)} | ${stats.avg_retry_count.toFixed(2)} |`;
  });

  const resultRows = rows.map((row) => {
    return `| ${row.id} | ${row.category} | ${row.success ? 'pass' : 'fail'} | ${row.latency_ms} | ${row.retry_count} | ${row.failure_stage || ''} | ${row.validation_issues_count} | ${row.tables_generated} | ${row.endpoints_generated} | ${row.pages_generated} |`;
  });

  return `# AI Compiler Evaluation Report

## Summary

- Total prompts: ${runSummary.total}
- Successes: ${runSummary.successes}
- Failures: ${runSummary.failures}
- Overall success rate: ${(runSummary.success_rate * 100).toFixed(1)}%
- Average latency: ${runSummary.avg_latency_ms.toFixed(1)} ms
- Average retry count: ${runSummary.avg_retry_count.toFixed(2)}

## Success by Category

| Category | Total | Successes | Success Rate | Avg Latency (ms) | Avg Retry Count |
| --- | ---: | ---: | ---: | ---: | ---: |
${categoryRows.join('\n')}

## Prompt Results

| Prompt ID | Category | Success | Latency (ms) | Retry Count | Failure Stage | Validation Issues | Tables | Endpoints | Pages |
| --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
${resultRows.join('\n')}
`;
}

async function runEvaluation(options = {}) {
  ensureDir(OUTPUT_DIR);

  const startedAt = new Date().toISOString();
  const results = [];
  const entries = normalizeDatasetEntries(dataset);

  for (const entry of entries) {
    const startTime = Date.now();
    let result;
    let thrownError = null;

    try {
      result = await compileApplication(entry.prompt, options);
    } catch (error) {
      thrownError = error;
      result = {
        success: false,
        stage: 'pipeline_exception',
        error: error.message,
      };
    }

    const latencyMs = Date.now() - startTime;
    const validationIssues = getValidationIssues(result);
    const retryCount = Number(result?.retryCount || result?.validation?.cycles?.length || 0);
    const failureStage = getFailureStage(result);
    const errorType = getErrorType(
      thrownError ? { success: false, error: thrownError.message, stage: 'pipeline_exception' } : result,
      validationIssues
    );
    const tablesGenerated = result?.appConfig?.db?.tables?.length ?? result?.schema?.db?.tables?.length ?? 0;
    const endpointsGenerated = result?.appConfig?.api?.endpoints?.length ?? result?.schema?.api?.endpoints?.length ?? 0;
    const pagesGenerated = result?.appConfig?.ui?.pages?.length ?? result?.schema?.ui?.pages?.length ?? 0;

    results.push({
      id: entry.id,
      category: entry.category,
      prompt: entry.prompt,
      success: Boolean(result?.success),
      success_rate: Boolean(result?.success),
      latency_ms: latencyMs,
      retry_count: retryCount,
      failure_stage: failureStage,
      validation_issues_count: validationIssues.length,
      error_type: errorType,
      tables_generated: tablesGenerated,
      endpoints_generated: endpointsGenerated,
      pages_generated: pagesGenerated,
      validation_issues: validationIssues,
      raw_stage: result?.stage || null,
      app_name: result?.appConfig?.app_name || null,
    });
  }

  const total = results.length;
  const successes = results.filter((row) => row.success).length;
  const failures = total - successes;
  const success_rate = total ? successes / total : 0;
  const avg_latency_ms = average(results.map((row) => row.latency_ms));
  const avg_retry_count = average(results.map((row) => row.retry_count));

  const byCategory = {};
  for (const category of ['normal', 'vague', 'edge']) {
    const categoryRows = results.filter((row) => row.category === category);
    const categorySuccesses = categoryRows.filter((row) => row.success).length;
    byCategory[category] = {
      total: categoryRows.length,
      successes: categorySuccesses,
      failures: categoryRows.length - categorySuccesses,
      success_rate: categoryRows.length ? categorySuccesses / categoryRows.length : 0,
      avg_latency_ms: average(categoryRows.map((row) => row.latency_ms)),
      avg_retry_count: average(categoryRows.map((row) => row.retry_count)),
    };
  }

  const summary = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    total,
    successes,
    failures,
    success_rate,
    avg_latency_ms,
    avg_retry_count,
    byCategory,
  };

  const resultsPayload = {
    summary,
    results,
  };

  const report = buildMarkdownReport(summary, results);

  fs.writeFileSync(RESULTS_PATH, `${JSON.stringify(resultsPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(REPORT_PATH, `${report}\n`, 'utf8');

  return {
    summary,
    results,
    results_path: RESULTS_PATH,
    report_path: REPORT_PATH,
  };
}

if (require.main === module) {
  runEvaluation()
    .then((output) => {
      console.log(JSON.stringify(output.summary, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runEvaluation,
  RESULTS_PATH,
  REPORT_PATH,
};
