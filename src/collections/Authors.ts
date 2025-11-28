import type { CollectionConfig } from 'payload'

/**
 * Authors Collection
 *
 * Blog post authors with profile information and social links.
 * Authors are displayed on blog posts and have their own archive pages.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'job', 'updatedAt'],
    description: 'Blog post authors',
  },
  access: {
    // Public read access
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: {
        description: 'Full name of the author',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "john-doe")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from name if not provided
            if (!value && data?.name) {
              return data.name
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
      name: 'job',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Job title or role (e.g., "Creator of ViaProto")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 300,
      admin: {
        description: 'Short bio for the author page',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Profile picture (square aspect ratio recommended)',
      },
    },
    {
      name: 'socials',
      type: 'array',
      admin: {
        description: 'Social media links',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'Website', value: 'website' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Bluesky', value: 'bluesky' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full URL to the social profile',
          },
        },
      ],
    },
  ],
}
