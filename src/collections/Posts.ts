import type { CollectionConfig } from 'payload'

/**
 * Posts Collection
 *
 * Blog posts with rich text content, categorization, and author attribution.
 * Supports draft/published workflow with scheduled publishing.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'publishedAt'],
    description: 'Blog posts',
    listSearchableFields: ['title', 'description', 'slug'],
  },
  access: {
    // Public can only read published posts
    read: ({ req: { user } }) => {
      // Logged-in admin users can see all posts (drafts included)
      if (user) return true
      // Public can only see published posts
      return {
        status: {
          equals: 'published',
        },
      }
    },
  },
  fields: [
    // Main content fields
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Post title (max 100 characters)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from title if not provided
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 160,
      admin: {
        description: 'SEO meta description (max 160 characters)',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Main article image (1200x660 recommended)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Post content - use headings, lists, links, and images',
      },
    },

    // Relationships
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        description: 'Post author',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Post categories',
      },
    },

    // Publishing controls
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Publication status',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        description: 'Publication date',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
