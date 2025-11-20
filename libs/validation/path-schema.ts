import { z } from 'zod';

/**
 * Schema for validating individual resources
 */
export const ResourceSchema = z.object({
  order: z.number().positive().int(),
  title: z.string().min(1).max(500),
  url: z.string().url().regex(/^https?:\/\//, 'URL must start with http:// or https://'),
  type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
  is_free: z.boolean().nullable(),
  description: z.string().min(1).max(2000),
  estimated_minutes: z.number().positive().int().nullable(),
});

/**
 * Schema for validating sections
 */
export const SectionSchema = z.object({
  order: z.number().positive().int(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  prerequisite_level: z.enum(['required', 'recommended', 'optional']),
  notes: z.string().max(2000).nullable().optional(),
  estimated_hours: z.number().min(0),
  resources: z.array(ResourceSchema).min(1).max(20),
});

/**
 * Schema for validating the entire AI-generated learning path response
 */
export const AIPathResponseSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  total_estimated_hours: z.number().min(0).max(10000),
  sections: z.array(SectionSchema).min(1).max(20),
});

/**
 * Schema for validating the path generation request
 */
export const PathGenerationRequestSchema = z.object({
  topic_id: z.string().uuid(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.string().max(2000).optional(),
  is_public: z.boolean().optional().default(false),
  model_id: z.string().optional(), // User-selected model ID
});

/**
 * Schema for validating path update requests
 */
export const PathUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).max(2000).optional(),
  is_public: z.boolean().optional(),
});

/**
 * Type exports for TypeScript
 */
export type Resource = z.infer<typeof ResourceSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type AIPathResponse = z.infer<typeof AIPathResponseSchema>;
export type PathGenerationRequest = z.infer<typeof PathGenerationRequestSchema>;
export type PathUpdate = z.infer<typeof PathUpdateSchema>;
