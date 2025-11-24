/**
 * Job Types and Payload Definitions for Graphile Worker
 *
 * This file defines all job types and their payload structures for the
 * background job processing system.
 */

/**
 * All available job types in the system
 */
export type JobType =
  | 'generate_metadata'
  | 'fetch_unsplash_image'
  | 'research_resources'
  | 'generate_sections_resources'
  | 'validate_and_finalize'
  | 'validate_resource_links'
  | 'replace_broken_resources'
  | 'enrich_sections'
  | 'notify_generation_failed';

/**
 * Payload for Job #1: generate_metadata
 * Generates path title, description, and skill level using AI
 */
export interface GenerateMetadataPayload {
  pathId: string;
  topicId: string;
  topicName: string;
  goals?: string;
  modelId: string;
}

/**
 * Payload for Job #2: fetch_unsplash_image
 * Fetches and attaches cover image from Unsplash
 */
export interface FetchUnsplashImagePayload {
  pathId: string;
  topicName: string;
}

/**
 * Payload for Job #3: research_resources (NEW - Prompt Chain Step 1)
 * Uses web search to discover 30-50 candidate learning resources
 * Stores results in generation_metadata.researched_resources
 */
export interface ResearchResourcesPayload {
  pathId: string;
  topicName: string;
  skillLevel: string;
}

/**
 * Payload for Job #4: generate_sections_resources (MODIFIED - Prompt Chain Step 2)
 * Organizes pre-researched resources into logical learning sections
 * Uses researched_resources from Job #3
 */
export interface GenerateSectionsResourcesPayload {
  pathId: string;
}

/**
 * Payload for Job #5: validate_and_finalize (NEW - Prompt Chain Step 3)
 * Validates generated sections/resources and persists to database
 * Final step before marking path as completed
 */
export interface ValidateAndFinalizePayload {
  pathId: string;
}

/**
 * Payload for Job #6: validate_resource_links
 * Fetches OpenGraph metadata and validates all resource links
 * Runs after sections and resources are generated
 */
export interface ValidateResourceLinksPayload {
  pathId: string;
}

/**
 * Payload for Job #7: replace_broken_resources (Resource Improvement Step 1)
 * Replaces broken or inaccessible resource links with working alternatives
 * Triggered when > 3 broken/inaccessible resources found
 */
export interface ReplaceBrokenResourcesPayload {
  pathId: string;
}

/**
 * Payload for Job #8: enrich_sections (Resource Improvement Step 2)
 * Adds complementary resources to sections with < 5 active resources
 * Triggered after validation or replacement when sections are under-resourced
 */
export interface EnrichSectionsPayload {
  pathId: string;
}

/**
 * Payload for notify_generation_failed job
 * Sends email notification when generation fails
 */
export interface NotifyGenerationFailedPayload {
  pathId: string;
  step: string; // 'generate_metadata' | 'fetch_unsplash_image' | 'generate_sections_resources' | 'validate_resource_links'
  error: string;
  userId: string;
  topicName: string;
}

/**
 * Union type of all job payloads
 * Useful for type-safe job queue functions
 */
export type JobPayload =
  | GenerateMetadataPayload
  | FetchUnsplashImagePayload
  | ResearchResourcesPayload
  | GenerateSectionsResourcesPayload
  | ValidateAndFinalizePayload
  | ValidateResourceLinksPayload
  | ReplaceBrokenResourcesPayload
  | EnrichSectionsPayload
  | NotifyGenerationFailedPayload;
