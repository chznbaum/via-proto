/**
 * Payload CMS Query Utilities
 *
 * Helper functions for querying blog content from Payload CMS.
 * All queries use depth: 2 to populate relationships (author, categories, featuredImage).
 */

import { getPayloadClient } from './client'
import type { Post, Author, Category } from '@/payload-types'

// ============================================================================
// Posts Queries
// ============================================================================

/**
 * Get all published posts, sorted by publishedAt descending
 */
export async function getAllPosts(limit = 100): Promise<Post[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    limit,
    depth: 2, // Populate author, categories, featuredImage
  })

  return docs as Post[]
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: 'published',
      },
    },
    limit: 1,
    depth: 2,
  })

  return (docs[0] as Post) || null
}

/**
 * Get posts by category slug
 */
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const payload = await getPayloadClient()

  // First, get the category ID
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: categorySlug,
      },
    },
    limit: 1,
  })

  if (!categories[0]) return []

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      categories: {
        contains: categories[0].id,
      },
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    depth: 2,
  })

  return docs as Post[]
}

/**
 * Get posts by author slug
 */
export async function getPostsByAuthor(authorSlug: string): Promise<Post[]> {
  const payload = await getPayloadClient()

  // First, get the author ID
  const { docs: authors } = await payload.find({
    collection: 'authors',
    where: {
      slug: {
        equals: authorSlug,
      },
    },
    limit: 1,
  })

  if (!authors[0]) return []

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      author: {
        equals: authors[0].id,
      },
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    depth: 2,
  })

  return docs as Post[]
}

/**
 * Get related posts (same category, excluding current post)
 */
export async function getRelatedPosts(
  currentSlug: string,
  categoryIds: string[],
  limit = 3
): Promise<Post[]> {
  if (categoryIds.length === 0) return []

  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      and: [
        {
          slug: {
            not_equals: currentSlug,
          },
        },
        {
          status: {
            equals: 'published',
          },
        },
        {
          or: categoryIds.map((id) => ({
            categories: {
              contains: id,
            },
          })),
        },
      ],
    },
    sort: '-publishedAt',
    limit,
    depth: 2,
  })

  return docs as Post[]
}

// ============================================================================
// Categories Queries
// ============================================================================

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  return docs as Category[]
}

/**
 * Get a single category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  return (docs[0] as Category) || null
}

// ============================================================================
// Authors Queries
// ============================================================================

/**
 * Get all authors
 */
export async function getAllAuthors(): Promise<Author[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'authors',
    limit: 100,
    depth: 1, // Populate avatar
  })

  return docs as Author[]
}

/**
 * Get a single author by slug
 */
export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'authors',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 1, // Populate avatar
  })

  return (docs[0] as Author) || null
}
