import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  // Enable Payload's built-in authentication
  auth: true,
  admin: {
    useAsTitle: 'email',
    description: 'Admin users who can access the CMS (separate from app users)',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Full name of the admin user',
      },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Admin = full access, Editor = can manage content only',
      },
    },
  ],
}
