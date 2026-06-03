function normalizeIdentifier(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

function toPascalCase(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveDrizzleColumn(column) {
  const name = normalizeIdentifier(column.name);
  const type = String(column.type || 'text').toLowerCase();
  const nullableSuffix = column.required === false ? '.nullable()' : '';

  if (type.includes('uuid')) {
    return `  ${name}: uuid('${name}').defaultRandom()${nullableSuffix},`;
  }
  if (type.includes('int')) {
    return `  ${name}: integer('${name}')${nullableSuffix},`;
  }
  if (type.includes('bool')) {
    return `  ${name}: boolean('${name}')${nullableSuffix},`;
  }
  if (type.includes('time') || type.includes('date')) {
    return `  ${name}: timestamp('${name}')${nullableSuffix},`;
  }
  if (type.includes('text')) {
    return `  ${name}: text('${name}')${nullableSuffix},`;
  }
  if (type.includes('varchar')) {
    const match = type.match(/varchar\((\d+)\)/);
    const size = match ? `, { length: ${match[1]} }` : '';
    return `  ${name}: varchar('${name}'${size})${nullableSuffix},`;
  }

  return `  ${name}: text('${name}')${nullableSuffix},`;
}

function generateExpressRoutes(appConfig) {
  const endpointBlocks = (appConfig.api?.endpoints || []).map((endpoint) => {
    const method = String(endpoint.method || 'GET').toLowerCase();
    const responseRef = endpoint.response?.ref || '';
    const authRoles = (endpoint.auth_roles || []).length ? `// auth roles: ${endpoint.auth_roles.join(', ')}` : '// public endpoint';
    const requestFields = (endpoint.request_body?.fields || []).map((field) => field.name).join(', ');

    return `router.${method}('${endpoint.path}', async (req, res) => {\n  ${authRoles}\n  // endpoint id: ${endpoint.id}\n  // request fields: ${requestFields || 'none'}\n  res.json({ ref: '${responseRef}' });\n});`;
  });

  return `const express = require('express');\nconst router = express.Router();\n\n${endpointBlocks.join('\n\n')}\n\nmodule.exports = router;\n`;
}

function generateDrizzleSchema(appConfig) {
  const tableBlocks = (appConfig.db?.tables || []).map((table) => {
    const columns = (table.columns || []).map(resolveDrizzleColumn).join('\n');
    const tableName = normalizeIdentifier(table.name);
    const exportName = toPascalCase(table.name) || 'Table';
    return `export const ${exportName} = pgTable('${tableName}', {\n${columns}\n});`;
  });

  return `import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';\n\n${tableBlocks.join('\n\n')}\n`;
}

function generateCodeBundle(appConfig) {
  const expressRoutesCode = generateExpressRoutes(appConfig);
  const drizzleSchemaCode = generateDrizzleSchema(appConfig);

  return {
    expressRoutesCode,
    drizzleSchemaCode,
    files: {
      'runtime/expressRoutes.js': expressRoutesCode,
      'runtime/drizzleSchema.ts': drizzleSchemaCode,
    },
  };
}

module.exports = {
  generateCodeBundle,
  generateDrizzleSchema,
  generateExpressRoutes,
  normalizeIdentifier,
  toPascalCase,
};
