/**
 * Payload CMS Generated Types
 *
 * Manually created based on collection definitions in src/collections/
 * These types mirror what `payload generate:types` would produce.
 */

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

// ============================================================================
// Base Types
// ============================================================================

export interface PayloadTimestamps {
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Media Collection
// ============================================================================

export interface MediaSize {
  url?: string | null
  cdnUrl?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  filesize?: number | null
  filename?: string | null
}

export interface Media extends PayloadTimestamps {
  id: string
  alt: string
  url?: string | null
  cdnUrl?: string | null
  filename?: string | null
  mimeType?: string | null
  filesize?: number | null
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
  sizes?: {
    thumbnail?: MediaSize | null
    card?: MediaSize | null
    hero?: MediaSize | null
  }
}

// ============================================================================
// Authors Collection
// ============================================================================

export interface AuthorSocial {
  platform: 'twitter' | 'linkedin' | 'github' | 'website' | 'youtube' | 'bluesky'
  url: string
  id?: string | null
}

export interface Author extends PayloadTimestamps {
  id: string
  name: string
  slug: string
  job?: string | null
  description?: string | null
  avatar: string | Media
  socials?: AuthorSocial[] | null
}

// ============================================================================
// Categories Collection
// ============================================================================

export interface Category extends PayloadTimestamps {
  id: string
  title: string
  slug: string
  titleShort?: string | null
  description?: string | null
  descriptionShort?: string | null
}

// ============================================================================
// Posts Collection
// ============================================================================

export interface Post extends PayloadTimestamps {
  id: string
  title: string
  slug: string
  description: string
  featuredImage: string | Media
  content: SerializedEditorState
  author: string | Author
  categories: (string | Category)[]
  status: 'draft' | 'published'
  publishedAt: string
}

// ============================================================================
// Users Collection (Payload Admin Users)
// ============================================================================

export interface User extends PayloadTimestamps {
  id: string
  email: string
  name?: string | null
  role?: 'admin' | 'editor' | null
  resetPasswordToken?: string | null
  resetPasswordExpiration?: string | null
  salt?: string | null
  hash?: string | null
  loginAttempts?: number | null
  lockUntil?: string | null
}

// ============================================================================
// Config Type (for Payload generics)
// ============================================================================

export interface Config {
  collections: {
    users: User
    media: Media
    authors: Author
    categories: Category
    posts: Post
  }
  globals: {}
  locale: null
  user: User
}

// ============================================================================
// Declare module for Payload type inference
// ============================================================================

declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}
