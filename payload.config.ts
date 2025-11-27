import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections
import { Users } from './src/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Secret key for JWT encryption
  secret: process.env.PAYLOAD_SECRET || '',

  // Database adapter - uses existing Supabase Postgres
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Payload tables will be in a separate schema to avoid conflicts
    schemaName: 'payload',
  }),

  // Admin UI configuration
  admin: {
    user: 'users', // Collection name for admin users
    meta: {
      titleSuffix: '- ViaProto Admin',
      favicon: '/favicon.ico',
    },
    // Required for server functions to work properly
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  // Email adapter - uses Resend (same as app)
  email: resendAdapter({
    defaultFromAddress: 'noreply@viapro.to',
    defaultFromName: 'ViaProto',
    apiKey: process.env.RESEND_API_KEY || '',
  }),

  // Collections
  collections: [
    Users,
  ],

  // Rich text editor
  editor: lexicalEditor({}),

  // TypeScript output path
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Sharp for image processing
  sharp,

  // Plugins will be added in Phase 3 (S3 storage)
  plugins: [],
})
