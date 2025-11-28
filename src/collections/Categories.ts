import type { CollectionConfig } from 'payload'

/**
 * Categories Collection
 *
 * Blog post categories for organizing content.
 * Categories are displayed as badges on posts and have their own archive pages.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: 'Blog post categories',
  },
  access: {
    // Public read access
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: {
        description: 'Category name (e.g., "New Features")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "feature")',
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
      name: 'titleShort',
      type: 'text',
      maxLength: 20,
      admin: {
        description: 'Short version for badges (1-2 words, e.g., "Features")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
      admin: {
        description: 'Description for category archive page',
      },
    },
    {
      name: 'descriptionShort',
      type: 'textarea',
      maxLength: 80,
      admin: {
        description: 'Short description for mobile views',
      },
    },
  ],
}
