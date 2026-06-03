const { z } = require('zod');

const ArchitectureSchema = z.object({
  app_name: z.string().min(1),
  summary: z.string().min(1),
  bounded_contexts: z.array(
    z.object({
      name: z.string().min(1),
      purpose: z.string().min(1),
      capabilities: z.array(z.string()).default([]),
    })
  ).default([]),
  services: z.array(
    z.object({
      name: z.string().min(1),
      responsibility: z.string().min(1),
      inputs: z.array(z.string()).default([]),
      outputs: z.array(z.string()).default([]),
    })
  ).default([]),
  api_surface: z.array(
    z.object({
      resource: z.string().min(1),
      methods: z.array(z.string()).default([]),
      description: z.string().min(1),
    })
  ).default([]),
  ui_structure: z.array(
    z.object({
      page: z.string().min(1),
      components: z.array(z.string()).default([]),
    })
  ).default([]),
  auth_model: z.string().min(1),
  data_flow: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  open_questions: z.array(z.string()).default([]),
});

module.exports = {
  ArchitectureSchema,
};
