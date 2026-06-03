const { AppConfigSchema } = require('../schemas/appConfigSchema');
const { info } = require('../utils/logger');

function validateAppConfig(appConfig) {
  info('stage4_validation', 'validating app config');

  const parsed = AppConfigSchema.safeParse(appConfig);
  if (!parsed.success) {
    return {
      success: false,
      valid: false,
      data: null,
      issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`),
    };
  }

  const issues = [];
  const warnings = [];

  if (!parsed.data.schema.tables.length) {
    issues.push('schema.tables must contain at least one table');
  }

  if (!parsed.data.runtime.generated_files.length) {
    warnings.push('runtime.generated_files is empty');
  }

  return {
    success: true,
    valid: issues.length === 0,
    data: {
      ...parsed.data,
      validation: {
        passed: issues.length === 0,
        issues,
        warnings,
      },
    },
    issues,
    warnings,
  };
}

module.exports = {
  validateAppConfig,
};
