/**
 * Payload CMS Client Helper
 *
 * Provides a cached Payload instance for use in server components and API routes.
 * Uses the Next.js-compatible import pattern with @payload-config alias.
 */

import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Get Payload instance
 *
 * Returns a cached Payload instance for database operations.
 * Safe to call multiple times - Payload handles caching internally.
 *
 * @example
 * ```ts
 * const payload = await getPayloadClient()
 * const posts = await payload.find({ collection: 'posts' })
 * ```
 */
export async function getPayloadClient() {
  return getPayload({ config })
}
