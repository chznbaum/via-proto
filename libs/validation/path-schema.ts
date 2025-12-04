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
 * NOTE: This schema is deprecated in favor of split schemas below.
 * Kept for reference during migration to job-based generation.
 */
export const AIPathResponseSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  total_estimated_hours: z.number().min(0).max(10000),
  sections: z.array(SectionSchema).min(1).max(20),
});

/**
 * Schema for validating Job #1 response: Metadata generation
 * OpenRouter generates just the path title, description, and skill level
 * Total hours are calculated later after sections/resources are generated
 */
export const MetadataResponseSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
});

/**
 * Schema for validating Job #3 response: Sections and resources generation
 * OpenRouter generates the learning content based on metadata from Job #1
 * Includes total_estimated_hours calculated from section hours
 */
export const SectionsResourcesResponseSchema = z.object({
  sections: z.array(SectionSchema).min(1).max(20),
  total_estimated_hours: z.number().min(0).max(10000),
});

/**
 * Schema for validating the path generation request
 * Note: skill_level is now calculated from user's competency proficiency levels
 */
export const PathGenerationRequestSchema = z.object({
  topic_id: z.string().uuid(),
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
export type MetadataResponse = z.infer<typeof MetadataResponseSchema>;
export type SectionsResourcesResponse = z.infer<typeof SectionsResourcesResponseSchema>;
export type PathGenerationRequest = z.infer<typeof PathGenerationRequestSchema>;
export type PathUpdate = z.infer<typeof PathUpdateSchema>;

/**
 * Schema for adding a resource to a section
 */
export const AddResourceRequestSchema = z.object({
  section_id: z.string().uuid(),
  url: z.string().url().regex(/^https?:\/\//, 'URL must start with http:// or https://'),
  type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  is_free: z.boolean().nullable().optional(),
});

/**
 * Schema for reordering resources within a section
 * Client sends the complete new order as an array of resource IDs
 */
export const ReorderResourcesRequestSchema = z.object({
  section_id: z.string().uuid(),
  resource_order: z.array(z.string().uuid()).min(1),
});

/**
 * Schema for adding a new section to a path
 */
export const AddSectionRequestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
  prerequisite_level: z.enum(['required', 'recommended', 'optional']),
});

/**
 * Schema for reordering sections within a path
 * Client sends the complete new order as an array of section IDs
 */
export const ReorderSectionsRequestSchema = z.object({
  section_order: z.array(z.string().uuid()).min(1),
});

/**
 * Schema for remixing (forking) a path
 */
export const RemixPathRequestSchema = z.object({
  target_account_id: z.string().uuid().optional(),
  title: z.string().min(1).max(500).optional(),
  is_public: z.boolean().optional(),
});

/**
 * Type exports for editing schemas
 */
export type AddResourceRequest = z.infer<typeof AddResourceRequestSchema>;
export type ReorderResourcesRequest = z.infer<typeof ReorderResourcesRequestSchema>;
export type AddSectionRequest = z.infer<typeof AddSectionRequestSchema>;
export type ReorderSectionsRequest = z.infer<typeof ReorderSectionsRequestSchema>;
export type RemixPathRequest = z.infer<typeof RemixPathRequestSchema>;
