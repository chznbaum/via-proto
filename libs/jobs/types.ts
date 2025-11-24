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
  | 'generate_sections_resources'
  | 'validate_resource_links'
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
 * Payload for Job #3: generate_sections_resources
 * Generates learning sections and resources using AI
 * Uses metadata generated in Job #1
 */
export interface GenerateSectionsResourcesPayload {
  pathId: string;
}

/**
 * Payload for Job #4: validate_resource_links
 * Fetches OpenGraph metadata and validates all resource links
 * Runs after sections and resources are generated
 */
export interface ValidateResourceLinksPayload {
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
  | GenerateSectionsResourcesPayload
  | ValidateResourceLinksPayload
  | NotifyGenerationFailedPayload;
