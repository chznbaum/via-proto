import { z } from 'zod';

/**
 * Progress status for individual resources
 */
export const ResourceProgressStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'skipped',
]);

/**
 * Tracking status for paths
 */
export const TrackingStatusSchema = z.enum(['active', 'completed', 'archived']);

/**
 * Schema for updating resource progress
 */
export const UpdateResourceProgressSchema = z.object({
  status: ResourceProgressStatusSchema,
  notes: z.string().max(2000).optional(),
});

/**
 * Schema for dashboard query parameters
 */
export const ProgressDashboardQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'archived', 'all']).default('active'),
  sort: z.enum(['recent', 'progress', 'title']).default('recent'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Response type for path tracking record
 */
export const PathTrackingSchema = z.object({
  id: z.string().uuid(),
  learning_path_id: z.string().uuid(),
  status: TrackingStatusSchema,
  started_at: z.string(),
  last_activity_at: z.string(),
  completed_at: z.string().nullable(),
  archived_at: z.string().nullable(),
});

/**
 * Response type for resource progress record
 */
export const ResourceProgressSchema = z.object({
  id: z.string().uuid(),
  resource_id: z.string().uuid(),
  status: ResourceProgressStatusSchema,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  skipped_at: z.string().nullable(),
  notes: z.string().nullable(),
});

/**
 * Response type for progress summary
 */
export const ProgressSummarySchema = z.object({
  total_resources: z.number(),
  completed: z.number(),
  in_progress: z.number(),
  skipped: z.number(),
  not_started: z.number(),
  percentage: z.number(),
});

/**
 * Response type for learner stats
 */
export const LearnerStatsSchema = z.object({
  total_learners: z.number(),
  active_this_month: z.number(),
  completed_count: z.number(),
});

/**
 * Type exports
 */
export type ResourceProgressStatus = z.infer<typeof ResourceProgressStatusSchema>;
export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;
export type UpdateResourceProgress = z.infer<typeof UpdateResourceProgressSchema>;
export type ProgressDashboardQuery = z.infer<typeof ProgressDashboardQuerySchema>;
export type PathTracking = z.infer<typeof PathTrackingSchema>;
export type ResourceProgress = z.infer<typeof ResourceProgressSchema>;
export type ProgressSummary = z.infer<typeof ProgressSummarySchema>;
export type LearnerStats = z.infer<typeof LearnerStatsSchema>;
