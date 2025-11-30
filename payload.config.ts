import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { resendAdapter } from '@payloadcms/email-resend'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

// Collections
import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Authors } from './src/collections/Authors'
import { Categories } from './src/collections/Categories'
import { Posts } from './src/collections/Posts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Secret key for JWT encryption
  secret: process.env.PAYLOAD_SECRET || '',

  // Database adapter - uses existing Supabase Postgres
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      // Required for Supabase SSL connections in CI/CD environments
      ssl: process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
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
    Media,
    Authors,
    Categories,
    Posts,
  ],

  // Rich text editor
  editor: lexicalEditor({}),

  // TypeScript output path
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Sharp for image processing
  sharp,

  // Plugins
  plugins: [
    // S3 Storage - Scaleway Object Storage + BunnyCDN
    // In production: uploads go to Scaleway S3, served via BunnyCDN pull zone
    // In development: uses local storage (no S3 credentials needed)
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: {
              media: {
                // Store uploads in blog/uploads/ prefix
                prefix: 'blog/uploads',
              },
            },
            bucket: process.env.S3_BUCKET,
            config: {
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
              },
              region: process.env.S3_REGION || 'nl-ams',
              // Scaleway S3-compatible endpoint
              endpoint: process.env.S3_ENDPOINT || 'https://s3.nl-ams.scw.cloud',
              // Required for non-AWS S3 providers
              forcePathStyle: true,
            },
            // Public read access for CDN
            acl: 'public-read',
          }),
        ]
      : []),
  ],
})
