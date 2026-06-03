const { z } = require('zod');

const ValidationIssueSchema = z.object({
  type: z.string().min(1),
  severity: z.enum(['error', 'warning']),
  layer: z.enum(['db', 'api', 'ui']),
  detail: z.string().min(1),
  fix_hint: z.string().min(1),
});

const DbFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(true),
});

const DbTableSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  columns: z.array(DbFieldSchema).default([]),
  primary_key: z.string().min(1),
  foreign_keys: z.array(z.string()).default([]),
});

const DbSchema = z.object({
  tables: z.array(DbTableSchema).default([]),
  indexes: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
});

const ApiRequestFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(false),
});

const ApiEndpointSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().min(1),
  response: z.object({
    ref: z.string().min(1),
  }),
  request_body: z.object({
    fields: z.array(ApiRequestFieldSchema).default([]),
  }),
  auth_roles: z.array(z.string()).default([]),
  description: z.string().default(''),
});

const ApiSchema = z.object({
  endpoints: z.array(ApiEndpointSchema).default([]),
});

const UiComponentSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  api_endpoint: z.string().min(1),
  fields: z.array(
    z.object({
      name: z.string().min(1),
      source: z.string().optional(),
    })
  ).default([]),
  props: z.record(z.any()).default({}),
});

const UiSchema = z.object({
  components: z.array(UiComponentSchema).default([]),
  pages: z.array(z.string()).default([]),
});

const AuthSchema = z.object({
  auth_model: z.string().min(1),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  role_permissions: z.record(z.array(z.string())).default({}),
  business_rules: z.array(z.string()).default([]),
});

const AppConfigSchema = z.object({
  app_name: z.string().min(1),
  intent: z.object({}).passthrough(),
  architecture: z.object({}).passthrough(),
  db: DbSchema,
  api: ApiSchema,
  ui: UiSchema,
  auth: AuthSchema,
  validation: z.object({
    passed: z.boolean(),
    issues: z.array(ValidationIssueSchema).default([]),
    warnings: z.array(ValidationIssueSchema).default([]),
    report: z.object({}).passthrough().optional(),
  }),
  runtime: z.object({
    entrypoint: z.string().min(1),
    generated_files: z.array(z.string()).default([]),
    instructions: z.array(z.string()).default([]),
    express_routes_code: z.string().default(''),
    drizzle_schema_code: z.string().default(''),
  }),
  metadata: z.object({
    generated_at: z.string().min(1),
    version: z.string().min(1),
  }),
});

module.exports = {
  ApiEndpointSchema,
  ApiRequestFieldSchema,
  ApiSchema,
  AppConfigSchema,
  AuthSchema,
  DbFieldSchema,
  DbSchema,
  DbTableSchema,
  UiComponentSchema,
  UiSchema,
  ValidationIssueSchema,
};
