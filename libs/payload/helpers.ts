/**
 * Payload CMS Helper Utilities
 *
 * Type guards and helper functions for working with Payload CMS data.
 * Handles the string | Object union types that Payload uses for relationships.
 */

import type { Media, Author, Category } from '@/payload-types'

// ============================================================================
// Type Guards for Relationships
// ============================================================================

/**
 * Check if a media field is populated (object) or just an ID (string)
 */
export function isPopulatedMedia(media: string | Media | null | undefined): media is Media {
  return typeof media === 'object' && media !== null && 'url' in media
}

/**
 * Check if an author field is populated (object) or just an ID (string)
 */
export function isPopulatedAuthor(author: string | Author | null | undefined): author is Author {
  return typeof author === 'object' && author !== null && 'name' in author
}

/**
 * Check if a category field is populated (object) or just an ID (string)
 */
export function isPopulatedCategory(category: string | Category | null | undefined): category is Category {
  return typeof category === 'object' && category !== null && 'title' in category
}

// ============================================================================
// Image URL Extraction
// ============================================================================

type ImageSize = 'thumbnail' | 'card' | 'hero'

/**
 * Extract the best available image URL from a Media object
 * Prefers CDN URL over direct S3 URL, and specified size over original
 */
export function getImageUrl(
  media: string | Media | null | undefined,
  preferredSize?: ImageSize
): string | null {
  if (!isPopulatedMedia(media)) return null

  // If a specific size is requested, try to get it
  if (preferredSize && media.sizes?.[preferredSize]) {
    const size = media.sizes[preferredSize]
    return size?.cdnUrl || size?.url || null
  }

  // Fall back to main image URL
  return media.cdnUrl || media.url || null
}

/**
 * Get image dimensions for a specific size
 */
export function getImageDimensions(
  media: string | Media | null | undefined,
  size?: ImageSize
): { width: number; height: number } | null {
  if (!isPopulatedMedia(media)) return null

  if (size && media.sizes?.[size]) {
    const sizeData = media.sizes[size]
    if (sizeData?.width && sizeData?.height) {
      return { width: sizeData.width, height: sizeData.height }
    }
  }

  // Fall back to original dimensions
  if (media.width && media.height) {
    return { width: media.width, height: media.height }
  }

  return null
}

/**
 * Get alt text from a Media object
 */
export function getImageAlt(media: string | Media | null | undefined): string {
  if (!isPopulatedMedia(media)) return ''
  return media.alt || ''
}

// ============================================================================
// Author Helpers
// ============================================================================

/**
 * Get author avatar URL
 */
export function getAuthorAvatarUrl(
  author: string | Author | null | undefined,
  size: ImageSize = 'thumbnail'
): string | null {
  if (!isPopulatedAuthor(author)) return null
  return getImageUrl(author.avatar, size)
}

/**
 * Get author name
 */
export function getAuthorName(author: string | Author | null | undefined): string {
  if (!isPopulatedAuthor(author)) return ''
  return author.name
}

/**
 * Get author slug
 */
export function getAuthorSlug(author: string | Author | null | undefined): string {
  if (!isPopulatedAuthor(author)) return ''
  return author.slug
}

// ============================================================================
// Category Helpers
// ============================================================================

/**
 * Get category display title (prefers titleShort for badges)
 */
export function getCategoryTitle(
  category: string | Category | null | undefined,
  preferShort = false
): string {
  if (!isPopulatedCategory(category)) return ''
  if (preferShort && category.titleShort) {
    return category.titleShort
  }
  return category.title
}

/**
 * Get category slug
 */
export function getCategorySlug(category: string | Category | null | undefined): string {
  if (!isPopulatedCategory(category)) return ''
  return category.slug
}

/**
 * Filter and return only populated categories from an array
 */
export function getPopulatedCategories(
  categories: (string | Category)[] | null | undefined
): Category[] {
  if (!categories) return []
  return categories.filter(isPopulatedCategory)
}
