const { z } = require('zod');

const IntentSchema = z.object({
  app_name: z.string().min(1),
  one_line_goal: z.string().min(1),
  problem_statement: z.string().min(1),
  primary_users: z.array(z.string()).default([]),
  core_capabilities: z.array(z.string()).default([]),
  data_entities: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      important_fields: z.array(z.string()).default([]),
      relationships: z.array(z.string()).default([]),
    })
  ).default([]),
  workflows: z.array(
    z.object({
      name: z.string().min(1),
      steps: z.array(z.string()).default([]),
    })
  ).default([]),
  ui_pages: z.array(z.string()).default([]),
  api_capabilities: z.array(z.string()).default([]),
  auth_requirements: z.array(z.string()).default([]),
  non_functional_requirements: z.array(z.string()).default([]),
  execution_constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
});

module.exports = {
  IntentSchema,
};
