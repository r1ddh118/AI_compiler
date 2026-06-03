const { z } = require('zod');

const AppConfigSchema = z.object({
  app_name: z.string().min(1),
  intent: z.object({}).passthrough(),
  architecture: z.object({}).passthrough(),
  schema: z.object({
    app_name: z.string().min(1),
    tables: z.array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        columns: z.array(
          z.object({
            name: z.string().min(1),
            type: z.string().min(1),
            required: z.boolean(),
            description: z.string().min(1),
          })
        ).default([]),
        primary_key: z.string().min(1),
        foreign_keys: z.array(z.string()).default([]),
      })
    ).default([]),
    indexes: z.array(z.string()).default([]),
    validation_rules: z.array(z.string()).default([]),
    notes: z.array(z.string()).default([]),
  }),
  auth: z.object({
    auth_model: z.string().min(1),
    roles: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
    business_rules: z.array(z.string()).default([]),
  }),
  validation: z.object({
    passed: z.boolean(),
    issues: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
  }),
  runtime: z.object({
    entrypoint: z.string().min(1),
    generated_files: z.array(z.string()).default([]),
    instructions: z.array(z.string()).default([]),
  }),
  metadata: z.object({
    generated_at: z.string().min(1),
    version: z.string().min(1),
  }),
});

module.exports = {
  AppConfigSchema,
};
