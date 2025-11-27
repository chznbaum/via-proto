# Payload CMS Migration Plan

**Date Created:** 2025-11-27
**Author:** Claude Code
**Status:** Planning Phase

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Migration Overview](#2-migration-overview)
3. [Prerequisites](#3-prerequisites)
4. [Phase 1: Payload CMS Installation](#phase-1-payload-cms-installation)
5. [Phase 2: Supabase Integration](#phase-2-supabase-integration)
6. [Phase 3: S3 Storage Configuration (Scaleway + BunnyCDN)](#phase-3-s3-storage-configuration-scaleway--bunnycdn)
7. [Phase 4: Collection Schema Design](#phase-4-collection-schema-design)
8. [Phase 5: Migrate Blog Components](#phase-5-migrate-blog-components)
9. [Phase 6: Admin UI Setup](#phase-6-admin-ui-setup)
10. [Phase 7: Testing](#phase-7-testing)
11. [Phase 8: Deployment](#phase-8-deployment)
12. [Extending Payload: Adding New Collections](#extending-payload-adding-new-collections)
13. [Rollback Plan](#rollback-plan)
14. [Resources](#resources)

---

## 1. Current State Analysis

### Blog Implementation

**Location:** `app/blog/_assets/content.tsx`

**Current Structure:**
- **Posts:** Empty array (`articles: articleType[] = []`)
- **Content:** JSX.Element (React components)
- **Images:** Static imports from `public/blog/` and `app/blog/_assets/images/`
- **Authors:** Hardcoded array with static avatars
- **Categories:** Hardcoded array (Feature, Tutorial)

**Data Model:**
```typescript
type articleType = {
  slug: string;
  title: string;
  description: string;
  categories: categoryType[];
  author: authorType;
  publishedAt: string;
  image: {
    src?: StaticImageData;
    urlRelative: string;
    alt: string;
  };
  content: JSX.Element;
}
```

### Asset Management

**Storage:** Scaleway Object Storage (S3-compatible)
- **Endpoint:** `https://s3.nl-ams.scw.cloud`
- **Buckets:**
  - Staging: `viaproto-dev`
  - Production: `viaproto-prod`
- **CDN:** BunnyCDN
  - Staging: `https://cdn-dev.viapro.to`
  - Production: `https://cdn.viapro.to`

**Upload Process:**
1. Build Next.js app
2. Run `scripts/upload-static-to-s3.sh [staging|production]`
3. Syncs `public/` folder to S3
4. BunnyCDN pulls from S3 origin

**Credentials:**
- `AWS_ACCESS_KEY_ID` (Scaleway API key)
- `AWS_SECRET_ACCESS_KEY` (Scaleway secret key)

### Database

**Provider:** Supabase (PostgreSQL)
- Already managing: profiles, accounts, learning_paths, sections, resources
- Connection: `DATABASE_URL` in environment

---

## 2. Migration Overview

### Goals

1. ✅ Replace hardcoded blog array with Payload CMS database
2. ✅ Enable visual editing for non-technical users
3. ✅ Maintain TypeScript code-first editing for technical users
4. ✅ Use existing Supabase Postgres (no new database)
5. ✅ Maintain Scaleway + BunnyCDN asset pipeline
6. ✅ Keep blog components working with minimal changes
7. ✅ Design extensible architecture for future CMS collections

### Authentication Architecture: Two Separate Systems

**IMPORTANT:** This migration introduces a **second, independent authentication system** for CMS administration. Your existing Supabase Auth remains unchanged.

#### System 1: App Authentication (Existing - No Changes)

**Purpose:** Regular users accessing the learning path platform

**Technology:** Supabase Auth
- **Login Methods:** Magic links (email-based passwordless)
- **User Storage:** `auth.users` (Supabase managed) + `public.profiles` (your table)
- **Session Management:** Supabase JWT tokens in cookies
- **Access:** `/dashboard`, `/skills`, `/upgrade`, etc.
- **User Types:** Anyone creating/viewing learning paths

**Flow:**
```
User visits /dashboard
  → Redirected to /auth/login
  → Enters email
  → Receives magic link
  → Clicks link
  → Supabase validates token
  → Logged into app
  → Can create learning paths
```

#### System 2: CMS Authentication (New - Payload)

**Purpose:** Content managers/editors accessing the blog CMS

**Technology:** Payload CMS (built-in auth)
- **Login Methods:** Email + password
- **User Storage:** `payload.users` table (completely separate from app users)
- **Session Management:** Payload JWT tokens (separate from Supabase)
- **Access:** `/admin` only (CMS interface)
- **User Types:** Content editors, blog authors, administrators

**Flow:**
```
Admin visits /admin
  → Payload login screen
  → Enters admin email + password
  → Payload validates credentials
  → Logged into CMS
  → Can manage blog posts, upload images
```

#### Key Differences

| Aspect | App Auth (Supabase) | CMS Auth (Payload) |
|--------|---------------------|-------------------|
| **Users** | App users (public) | Admins/editors only |
| **Login URL** | `/auth/login` | `/admin/login` |
| **Credentials** | Magic link (email only) | Email + password |
| **Database Table** | `auth.users` + `public.profiles` | `payload.users` |
| **Session Tokens** | Supabase JWT | Payload JWT |
| **Access Scope** | App features | CMS only |
| **User Count** | Many (public) | Few (team members) |

#### Important Notes

1. **No Shared Users:** App users cannot access `/admin` and vice versa
2. **Separate Credentials:** Admin accounts need different email/password from app accounts
3. **Same Email OK:** You can use `admin@viapro.to` for Payload and also have `admin@viapro.to` as a Supabase app user (different systems)
4. **No Cross-Access:** Being logged into the app doesn't grant admin access
5. **Independent Sessions:** Logging out of app doesn't log out of admin

#### Who Needs Admin Accounts?

- ✅ You (Chazona) - for writing blog posts
- ✅ Future content writers/editors
- ✅ Marketing team members managing blog
- ❌ Regular app users (they don't need CMS access)
- ❌ Customers creating learning paths

### What Changes

| Component | Before | After |
|-----------|--------|-------|
| Blog Data | `content.tsx` array | Payload Postgres tables |
| Images | Static imports | Uploaded via Payload → Scaleway S3 |
| Content Editing | Edit `.tsx` file | Visual admin UI or code config |
| Content Format | JSX.Element | Rich Text (Lexical editor) |
| Data Fetching | Import array | Payload Local API |
| Admin UI | None | `/admin` route |

### What Stays the Same

- ✅ Blog page routes (`/blog`, `/blog/[articleId]`, etc.)
- ✅ Supabase database (just adds Payload tables)
- ✅ Scaleway S3 + BunnyCDN asset serving
- ✅ Next.js 15 App Router
- ✅ TypeScript-first development

---

## 3. Prerequisites

### Required Packages

```bash
# Core Payload
npm install payload@beta @payloadcms/next@beta

# Database adapter (Postgres)
npm install @payloadcms/db-postgres

# Rich text editor
npm install @payloadcms/richtext-lexical

# S3 storage adapter
npm install @payloadcms/storage-s3

# Development
npm install --save-dev @payloadcms/graphql
```

**Version Note:** Use `@beta` tags for Payload 3.x (Next.js 15 compatible)

### Environment Variables

Add to `.env.local` and `.env.example`:

```bash
# Payload CMS
PAYLOAD_SECRET=<generate-random-32-char-string>

# Already have these from Scaleway
AWS_ACCESS_KEY_ID=<scaleway-access-key>
AWS_SECRET_ACCESS_KEY=<scaleway-secret-key>
SCALEWAY_REGION=nl-ams
SCALEWAY_BUCKET_STAGING=viaproto-dev
SCALEWAY_BUCKET_PRODUCTION=viaproto-prod

# Already have this
DATABASE_URL=<supabase-postgres-connection-string>

# CDN URLs (already defined in build scripts)
CDN_URL_STAGING=https://cdn-dev.viapro.to
CDN_URL_PRODUCTION=https://cdn.viapro.to
```

### Generate Payload Secret

```bash
# Generate a random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Phase 1: Payload CMS Installation

### Step 1.1: Install Dependencies

```bash
npm install payload@beta @payloadcms/next@beta @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-s3
```

### Step 1.2: Create Payload Config

**Location:** `payload.config.ts` (project root)

```typescript
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'

export default buildConfig({
  // Secret key for JWT encryption
  secret: process.env.PAYLOAD_SECRET || '',

  // Database adapter - uses existing Supabase Postgres
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Payload tables will be prefixed to avoid conflicts
    schemaName: 'payload',
  }),

  // Admin UI configuration
  admin: {
    user: 'users', // Collection name for admin users
    bundler: 'webpack',
  },

  // Collections will be defined in Phase 4
  collections: [],

  // Rich text editor
  editor: lexicalEditor({}),

  // TypeScript output path
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
```

### Step 1.3: Update Next.js Config

**File:** `next.config.js`

Add Payload to Next.js:

```javascript
const { withPayload } = require('@payloadcms/next/withPayload')

// ... existing config ...

module.exports = withPayload(nextConfig)
```

### Step 1.4: Create Admin Route

**Location:** `app/(payload)/admin/[[...segments]]/page.tsx`

```typescript
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import config from '@payload-config'

type Args = {
  params: {
    segments: string[]
  }
  searchParams: { [key: string]: string | string[] }
}

export const generateMetadata = ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

**Location:** `app/(payload)/admin/importMap.js`

```javascript
import { RichTextCell as RichTextCell_0 } from '@payloadcms/richtext-lexical/client'
import { RichTextField as RichTextField_1 } from '@payloadcms/richtext-lexical/client'

export const importMap = {
  "@payloadcms/richtext-lexical/client#RichTextCell": RichTextCell_0,
  "@payloadcms/richtext-lexical/client#RichTextField": RichTextField_1,
}
```

**Location:** `app/(payload)/layout.tsx`

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ViaProto Admin',
  description: 'Content management for ViaProto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

---

## Phase 2: Supabase Integration

### Step 2.1: Configure Postgres Adapter

Payload will create its own schema in your Supabase database:

**Expected Schema Structure:**
```
Supabase Database:
├── public (existing)
│   ├── profiles
│   ├── accounts
│   ├── learning_paths
│   └── ... (your existing tables)
└── payload (new)
    ├── posts
    ├── posts_rels (relationships)
    ├── media
    ├── categories
    ├── authors
    ├── users (admin users)
    └── payload_preferences
```

### Step 2.2: Run Payload Migration

Payload will auto-create tables on first run, but you can also generate migrations:

```bash
# Generate migration files
npx payload migrate:create

# Apply migrations
npx payload migrate
```

**Migration Location:** `src/migrations/`

### Step 2.3: Verify Database Connection

```bash
# Start Next.js dev server
npm run dev

# Payload will log:
# ✓ Connected to database: <your-supabase-url>
# ✓ Auto-generated tables in schema: payload
```

---

## Phase 3: S3 Storage Configuration (Scaleway + BunnyCDN)

### Step 3.1: Install S3 Adapter

Already installed in Phase 1.

### Step 3.2: Configure S3 Plugin

**File:** `payload.config.ts`

```typescript
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  // ... existing config ...

  plugins: [
    s3Storage({
      collections: {
        // Collection name that will use S3 storage
        'media': true,
      },
      config: {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        region: process.env.SCALEWAY_REGION || 'nl-ams',
        endpoint: 'https://s3.nl-ams.scw.cloud',
        // Required for non-AWS S3 providers
        forcePathStyle: true,
      },
      bucket: process.env.NODE_ENV === 'production'
        ? process.env.SCALEWAY_BUCKET_PRODUCTION!
        : process.env.SCALEWAY_BUCKET_STAGING!,

      // Prefix for uploaded files
      prefix: 'blog/uploads',

      // ACL for public access
      acl: 'public-read',
    }),
  ],
})
```

### Step 3.3: Add CDN URL Transformation

Payload stores S3 URLs, but we want to serve via BunnyCDN:

**File:** `payload.config.ts`

Add custom field hook to transform URLs:

```typescript
const cdnUrl = process.env.NODE_ENV === 'production'
  ? 'https://cdn.viapro.to'
  : 'https://cdn-dev.viapro.to'

const s3BucketUrl = process.env.NODE_ENV === 'production'
  ? 'https://viaproto-prod.s3.nl-ams.scw.cloud'
  : 'https://viaproto-dev.s3.nl-ams.scw.cloud'

// Helper to transform S3 URL to CDN URL
function transformToCDN(s3Url: string): string {
  return s3Url.replace(s3BucketUrl, cdnUrl)
}
```

Use this in the Media collection (see Phase 4).

### Step 3.4: Update CSP Headers

**File:** `next.config.js`

Add Scaleway S3 to `img-src`:

```javascript
img-src 'self' blob: data: https: ${cdnDomains} https://s3.nl-ams.scw.cloud https://viaproto-prod.s3.nl-ams.scw.cloud https://viaproto-dev.s3.nl-ams.scw.cloud ...
```

---

## Phase 4: Collection Schema Design

### Step 4.1: Create Collections Directory

```bash
mkdir -p src/collections
```

### Step 4.2: Define Media Collection

**File:** `src/collections/Media.ts`

```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true, // Public read access
  },
  upload: {
    // S3 adapter handles storage
    staticURL: '/media',
    staticDir: 'media', // Fallback for local dev
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1200,
        height: 660,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'cdnUrl',
      type: 'text',
      admin: {
        readOnly: true,
      },
      hooks: {
        afterRead: [
          ({ data }) => {
            // Transform S3 URL to CDN URL
            if (data?.url) {
              return transformToCDN(data.url)
            }
            return data?.url
          },
        ],
      },
    },
  ],
}
```

### Step 4.3: Define Authors Collection

**File:** `src/collections/Authors.ts`

```typescript
import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Public read
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of name',
      },
    },
    {
      name: 'job',
      type: 'text',
      maxLength: 60,
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 160,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Twitter', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
```

### Step 4.4: Define Categories Collection

**File:** `src/collections/Categories.ts`

```typescript
import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'titleShort',
      type: 'text',
      maxLength: 20,
      admin: {
        description: '1-2 words for badges',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 160,
    },
    {
      name: 'descriptionShort',
      type: 'textarea',
      maxLength: 60,
      admin: {
        description: 'Mobile version',
      },
    },
  ],
}
```

### Step 4.5: Define Posts Collection

**File:** `src/collections/Posts.ts`

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'publishedAt'],
  },
  access: {
    // Public can only read published posts
    read: ({ req: { user } }) => {
      if (user) return true // Admin can see all
      return {
        status: {
          equals: 'published',
        },
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of title',
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
        description: 'SEO meta description',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      hasMany: false,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
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
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Add custom features here if needed
        ],
      }),
    },
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
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
```

### Step 4.6: Define Users Collection (Admin Users)

**IMPORTANT:** This is the **admin users collection** for CMS access only. This is **completely separate** from your app's Supabase `auth.users` table.

**File:** `src/collections/Users.ts`

```typescript
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
```

**Database Table Created:** `payload.users`

**Schema:**
```
payload.users
├── id (UUID)
├── email (unique)
├── password (hashed with bcrypt)
├── name
├── role
├── createdAt
└── updatedAt
```

**Note:** This table has **no relationship** to `auth.users` or `public.profiles`

### Step 4.7: Register Collections

**File:** `payload.config.ts`

```typescript
import { Media } from './src/collections/Media'
import { Authors } from './src/collections/Authors'
import { Categories } from './src/collections/Categories'
import { Posts } from './src/collections/Posts'
import { Users } from './src/collections/Users'

export default buildConfig({
  // ... existing config ...

  collections: [
    Users,
    Posts,
    Authors,
    Categories,
    Media,
  ],
})
```

---

## Phase 5: Migrate Blog Components

### Step 5.1: Create Payload Client Helper

**File:** `libs/payload/client.ts`

```typescript
import config from '@payload-config'
import { getPayload } from 'payload'

// Singleton instance
let cachedPayload: any = null

export async function getPayloadClient() {
  if (cachedPayload) {
    return cachedPayload
  }

  cachedPayload = await getPayload({ config })
  return cachedPayload
}
```

### Step 5.2: Create Data Fetching Utilities

**File:** `libs/payload/queries.ts`

```typescript
import { getPayloadClient } from './client'
import type { Post, Author, Category } from '@/payload-types'

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
    depth: 2, // Include author and categories
  })

  return docs
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2,
  })

  return docs[0] || null
}

export async function getPostsByCategory(
  categorySlug: string
): Promise<Post[]> {
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

  return docs
}

export async function getPostsByAuthor(
  authorSlug: string
): Promise<Post[]> {
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

  return docs
}

export async function getAllCategories(): Promise<Category[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  return docs
}

export async function getAllAuthors(): Promise<Author[]> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'authors',
    limit: 100,
  })

  return docs
}
```

### Step 5.3: Update Blog Index Page

**File:** `app/blog/page.tsx`

Replace:
```typescript
import { categories, articles } from "./_assets/content";
```

With:
```typescript
import { getAllPosts, getAllCategories } from "@/libs/payload/queries";

export default async function Blog() {
  const articles = await getAllPosts(6);
  const categories = await getAllCategories();

  // Rest remains the same
  return (
    <>
      {/* ... */}
    </>
  );
}
```

### Step 5.4: Update Blog Article Page

**File:** `app/blog/[articleId]/page.tsx`

Replace:
```typescript
import { articles } from "../_assets/content";

const article = articles.find((article) => article.slug === articleId);
```

With:
```typescript
import { getPostBySlug, getAllPosts } from "@/libs/payload/queries";

const article = await getPostBySlug(articleId);

if (!article) {
  notFound();
}
```

### Step 5.5: Create Rich Text Renderer

**File:** `components/RichText.tsx`

```typescript
import { serializeLexical } from '@payloadcms/richtext-lexical/react'

export function RichText({ content }: { content: any }) {
  return (
    <div className="prose max-w-none">
      {serializeLexical({ nodes: content })}
    </div>
  )
}
```

Use in article page:
```typescript
import { RichText } from "@/components/RichText";

// In component:
<RichText content={article.content} />
```

### Step 5.6: Update Image References

Replace static image imports with Payload media URLs:

```typescript
// Before:
<Image src={article.image.src} alt={article.image.alt} />

// After:
<Image
  src={article.featuredImage.cdnUrl}
  alt={article.featuredImage.alt}
  width={1200}
  height={660}
/>
```

### Step 5.7: Update Sitemap Generation

**File:** `app/sitemap.xml/route.ts`

Replace:
```typescript
import { articles } from '@/app/blog/_assets/content';
```

With:
```typescript
import { getAllPosts } from '@/libs/payload/queries';

const articles = await getAllPosts();
```

---

## Phase 6: Admin UI Setup

### Step 6.1: Create First Admin User

**IMPORTANT:** This creates an admin account for the CMS, **NOT** an app user account.

#### Option 1: Via Browser (Recommended for First User)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3001/admin`

3. You'll see Payload's first-time setup screen:
   ```
   Create your first admin user

   Email: ____________________
   Password: __________________
   Confirm Password: __________
   Name (optional): ___________

   [Create First User]
   ```

4. Fill in credentials:
   - **Email:** Your admin email (e.g., `chazona@viapro.to`)
   - **Password:** Strong password (min 8 characters)
   - **Name:** Your name (e.g., "Chazona Baum")

5. Click "Create First User"

6. You'll be automatically logged into the admin panel

**Note:** This email/password is **only for `/admin` access**. If you want to use the same email for the app, you'll still need to create a separate Supabase account via magic link at `/auth/login`.

#### Option 2: Via CLI

```bash
npx payload create-first-user
```

Follow prompts:
```
Email: chazona@viapro.to
Password: ••••••••••••
Confirm Password: ••••••••••••
Name: Chazona Baum

✓ First admin user created successfully
```

### Step 6.1b: Managing Admin Users

#### Add Additional Admin Users

**Via Admin UI:**
1. Login to `/admin`
2. Click "Users" in sidebar
3. Click "Create New"
4. Fill in:
   - Email
   - Password
   - Name
   - Role (Admin or Editor)
5. Click "Save"

**Via Code (Seed Script):**

```typescript
// scripts/create-admin-user.ts
import { getPayload } from 'payload'
import config from '@payload-config'

async function createAdmin() {
  const payload = await getPayload({ config })

  const user = await payload.create({
    collection: 'users',
    data: {
      email: 'newadmin@viapro.to',
      password: 'secure-password-here',
      name: 'New Admin',
      role: 'editor',
    },
  })

  console.log('✅ Admin user created:', user.email)
  process.exit(0)
}

createAdmin()
```

Run:
```bash
npx tsx scripts/create-admin-user.ts
```

#### Reset Admin Password

If you forget your admin password:

```bash
# Via CLI
npx payload reset-password --collection users --email chazona@viapro.to
```

Or manually via database:
```sql
-- Connect to Supabase
-- Update password hash for admin user (you'll need to generate bcrypt hash)
UPDATE payload.users
SET password = '$2a$10$...' -- bcrypt hash of new password
WHERE email = 'chazona@viapro.to';
```

#### Remove Admin Access

```bash
# Via database
DELETE FROM payload.users WHERE email = 'oldadmin@viapro.to';
```

Or via Admin UI: Users → Select user → Delete

### Step 6.1c: Login to Admin Panel

**For Development:**
1. Visit: `http://localhost:3001/admin`
2. Enter admin email + password
3. Click "Login"

**For Production:**
1. Visit: `https://viapro.to/admin`
2. Enter admin email + password
3. Click "Login"

**Login Persistence:**
- Sessions last 7 days by default
- Can configure in `payload.config.ts`:
  ```typescript
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days in seconds
  }
  ```

**Logout:**
- Click your email in top-right corner
- Click "Logout"

### Step 6.2: Seed Initial Data

Create a seed script to populate authors and categories:

**File:** `scripts/seed-blog-data.ts`

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

async function seed() {
  const payload = await getPayload({ config })

  // Create categories
  const featureCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'New Features',
      slug: 'feature',
      titleShort: 'Features',
      description: "Here are the latest features I've added to ViaProto.",
      descriptionShort: 'Latest features added to ViaProto.',
    },
  })

  const tutorialCategory = await payload.create({
    collection: 'categories',
    data: {
      title: 'How Tos & Tutorials',
      slug: 'tutorial',
      titleShort: 'Tutorials',
      description: 'Learn how to use ViaProto with these step-by-step tutorials.',
      descriptionShort: 'Learn how to use ViaProto.',
    },
  })

  console.log('✅ Categories created')

  // Upload author avatar (you'll need to have the image file)
  // const avatarFile = await fs.promises.readFile('./path/to/avatar.png')
  // const avatar = await payload.create({
  //   collection: 'media',
  //   data: { alt: 'Author avatar' },
  //   file: { data: avatarFile, name: 'avatar.png', mimetype: 'image/png' },
  // })

  // Create author
  // const author = await payload.create({
  //   collection: 'authors',
  //   data: {
  //     name: 'Chazona Baum',
  //     slug: 'chazona',
  //     job: 'Creator of ViaProto',
  //     description: 'Building tools to help people learn faster.',
  //     avatar: avatar.id,
  //     socials: [
  //       { platform: 'twitter', url: 'https://twitter.com/...' },
  //     ],
  //   },
  // })

  console.log('✅ Seed data complete')
  process.exit(0)
}

seed()
```

Run:
```bash
npx tsx scripts/seed-blog-data.ts
```

### Step 6.3: Configure Admin UI Theme (Optional)

**File:** `payload.config.ts`

```typescript
admin: {
  meta: {
    titleSuffix: '- ViaProto Admin',
    favicon: '/favicon.ico',
    ogImage: '/og-image.png',
  },
  // Custom branding
  // components: {
  //   graphics: {
  //     Logo: '/path/to/CustomLogo',
  //   },
  // },
}
```

---

## Phase 7: Testing

### Step 7.1: Local Testing Checklist

- [ ] Admin UI loads at `/admin`
- [ ] Can create a new blog post
- [ ] Can upload images → verify they appear in Scaleway S3
- [ ] Can view uploaded image via CDN URL
- [ ] Blog index page loads and displays posts
- [ ] Individual blog post page renders correctly
- [ ] Rich text content displays properly
- [ ] Author info displays correctly
- [ ] Category filtering works
- [ ] Sitemap includes blog posts
- [ ] SEO meta tags are correct

### Step 7.2: Storage Testing

1. **Upload a test image via admin UI**
2. **Verify in Scaleway S3:**
   ```bash
   aws s3 ls s3://viaproto-dev/blog/uploads/ --endpoint-url https://s3.nl-ams.scw.cloud
   ```
3. **Verify CDN URL is accessible:**
   ```bash
   curl -I https://cdn-dev.viapro.to/blog/uploads/test-image.jpg
   ```

### Step 7.3: Database Testing

Check Payload tables were created:

```sql
-- Connect to Supabase
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'payload';

-- Expected tables:
-- posts
-- posts_rels
-- authors
-- categories
-- media
-- users
-- payload_preferences
```

### Step 7.4: Performance Testing

- [ ] Blog index page loads in < 1s
- [ ] Individual post page loads in < 1s
- [ ] Images load quickly via CDN
- [ ] No N+1 query issues (use `depth` parameter)

---

## Phase 8: Deployment

### Step 8.1: Environment Variables

Set in production environment (Coolify):

```bash
PAYLOAD_SECRET=<production-secret>
DATABASE_URL=<supabase-production-url>
AWS_ACCESS_KEY_ID=<scaleway-key>
AWS_SECRET_ACCESS_KEY=<scaleway-secret>
SCALEWAY_REGION=nl-ams
SCALEWAY_BUCKET_PRODUCTION=viaproto-prod
CDN_URL_PRODUCTION=https://cdn.viapro.to
NODE_ENV=production
```

### Step 8.2: Build and Deploy

```bash
# Build with production CDN URL
npm run build:production

# Upload static assets to Scaleway
npm run upload:production

# Deploy to Coolify
# (Coolify will run: npm run start)
```

### Step 8.3: Run Database Migrations in Production

```bash
# SSH into production server or run via Coolify exec
npx payload migrate
```

### Step 8.4: Create Production Admin User

**IMPORTANT:** Production admin users are **separate** from production app users.

#### Method 1: Via Browser (First User)

1. Visit: `https://viapro.to/admin`
2. Complete first-time setup wizard
3. Use a **production-specific admin email** (e.g., `admin@viapro.to`)
4. Use a **strong, unique password** (not the same as your app account)

#### Method 2: Via Production SSH/CLI

```bash
# SSH into production server or use Coolify exec
npx payload create-first-user
```

#### Security Best Practices

1. **Different Credentials:** Don't reuse your app login credentials for admin
2. **Strong Password:** Use password manager (min 16 characters)
3. **Limited Accounts:** Only create admin accounts for team members who need CMS access
4. **Regular Audits:** Review `payload.users` table quarterly to remove inactive admins
5. **2FA (Future):** Consider adding 2FA plugin for admin accounts

#### Common Mistake to Avoid

❌ **Wrong:** Expecting Supabase app users to access `/admin`
- App users (magic link auth) **cannot** access the CMS
- You must create separate admin accounts

✅ **Right:** Create dedicated admin accounts via `/admin` setup wizard
- Admins use email + password
- Completely independent from app authentication

### Step 8.5: Post-Deployment Checks

- [ ] Admin UI accessible at `https://viapro.to/admin`
- [ ] Blog posts visible at `https://viapro.to/blog`
- [ ] Images served from `https://cdn.viapro.to`
- [ ] Sitemap includes blog posts
- [ ] robots.txt allows crawling
- [ ] llms.txt includes blog paths

---

## Extending Payload: Adding New Collections

### General Pattern for New Collections

**Example: Adding a "Case Studies" collection**

### Step 1: Define Collection Schema

**File:** `src/collections/CaseStudies.ts`

```typescript
import type { CollectionConfig } from 'payload'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        status: { equals: 'published' },
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'client',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 160,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'metrics',
      type: 'group',
      fields: [
        {
          name: 'metric1Label',
          type: 'text',
        },
        {
          name: 'metric1Value',
          type: 'text',
        },
        // Add more metrics...
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
```

### Step 2: Register Collection

**File:** `payload.config.ts`

```typescript
import { CaseStudies } from './src/collections/CaseStudies'

export default buildConfig({
  collections: [
    // ... existing collections
    CaseStudies,
  ],
})
```

### Step 3: Create Query Helpers

**File:** `libs/payload/case-studies.ts`

```typescript
import { getPayloadClient } from './client'

export async function getAllCaseStudies() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
  })
  return docs
}
```

### Step 4: Create Frontend Pages

**File:** `app/case-studies/page.tsx`

```typescript
import { getAllCaseStudies } from '@/libs/payload/case-studies'

export default async function CaseStudiesPage() {
  const caseStudies = await getAllCaseStudies()

  return (
    <div>
      {caseStudies.map(study => (
        <div key={study.id}>{study.title}</div>
      ))}
    </div>
  )
}
```

### CMS Best Practices

1. **Always define TypeScript types** - Payload auto-generates them
2. **Use `depth` parameter** - Avoid N+1 queries by populating relationships
3. **Add access control** - Separate published vs. draft content
4. **Use hooks** - Transform data before save/read
5. **Version control config** - Collection schemas live in code
6. **Validate fields** - Use Zod or built-in validation
7. **Optimize images** - Define size variants in upload fields
8. **Add admin descriptions** - Help non-technical editors

### Common Collection Patterns

**Blog-style content:**
- `status` field (draft/published)
- `publishedAt` date
- `author` relationship
- `categories` relationship
- `featuredImage` upload
- `content` richText

**Directory/listing content:**
- `featured` boolean
- `order` number (for sorting)
- `externalUrl` text
- `tags` relationship or array

**Documentation content:**
- `category` relationship
- `order` number
- `parentPage` relationship (for hierarchy)
- `tableOfContents` generated from content

---

## Rollback Plan

### If Issues Arise During Migration

### Option 1: Keep Both Systems Temporarily

- Keep `app/blog/_assets/content.tsx` as fallback
- Use feature flag to toggle between old/new system
- Gradually migrate content

**File:** `libs/features.ts`

```typescript
export const USE_PAYLOAD_BLOG = process.env.USE_PAYLOAD_BLOG === 'true'
```

**File:** `app/blog/page.tsx`

```typescript
import { USE_PAYLOAD_BLOG } from '@/libs/features'
import { getAllPosts } from '@/libs/payload/queries'
import { articles as staticArticles } from './_assets/content'

export default async function Blog() {
  const articles = USE_PAYLOAD_BLOG
    ? await getAllPosts()
    : staticArticles

  // ...
}
```

### Option 2: Full Rollback

1. **Remove Payload packages:**
   ```bash
   npm uninstall payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical @payloadcms/storage-s3
   ```

2. **Restore blog components:**
   ```bash
   git checkout main -- app/blog/
   ```

3. **Remove Payload tables from Supabase:**
   ```sql
   DROP SCHEMA payload CASCADE;
   ```

4. **Remove Payload config:**
   ```bash
   rm payload.config.ts
   rm -rf src/collections/
   rm -rf app/(payload)/
   ```

---

## Resources

### Official Documentation

- **Payload CMS:** https://payloadcms.com/docs
- **Payload + Supabase Guide:** https://payloadcms.com/posts/guides/setting-up-payload-with-supabase-for-your-nextjs-app-a-step-by-step-guide
- **Payload + Next.js:** https://payloadcms.com/docs/frameworks/next/overview
- **Storage Adapters:** https://payloadcms.com/docs/upload/storage-adapters
- **S3 Adapter:** https://www.npmjs.com/package/@payloadcms/storage-s3

### Community Resources

- **Payload GitHub:** https://github.com/payloadcms/payload
- **Payload Discord:** https://discord.gg/payload
- **BunnyCDN Payload Plugin:** https://github.com/maximseshuk/payload-storage-bunny

### Scaleway Resources

- **S3 API Docs:** https://www.scaleway.com/en/docs/storage/object/api-cli/object-storage-aws-cli/
- **S3 Compatibility:** Scaleway Object Storage is S3-compatible via AWS SDK

---

## Next Steps

After completing this migration:

1. ✅ Test all blog functionality
2. ✅ Migrate existing blog posts (if any) from array to Payload
3. ✅ Train team members on Payload admin UI
4. ✅ Document content creation workflows
5. ✅ Consider adding other CMS collections (case studies, testimonials, etc.)
6. ✅ Set up automated backups of Payload tables
7. ✅ Monitor S3 storage costs and CDN usage

---

## Questions & Troubleshooting

### Common Issues

**Q: Images not loading from CDN**
- Check `cdnUrl` transformation is working
- Verify BunnyCDN is pulling from Scaleway origin
- Check CSP headers include CDN domain

**Q: Payload admin UI won't load**
- Verify `PAYLOAD_SECRET` is set
- Check `DATABASE_URL` is correct
- Run `npx payload migrate`

**Q: Type errors in frontend**
- Run `npx payload generate:types`
- Check `payload-types.ts` is up to date

**Q: S3 uploads failing**
- Verify Scaleway credentials
- Check bucket permissions
- Ensure `forcePathStyle: true` in config

**Q: Content not appearing on frontend**
- Check post status is 'published'
- Verify access control rules
- Check query depth includes relationships

**Q: Can't login to admin panel**
- Make sure you're using **admin credentials** (not app credentials)
- Admin login is at `/admin`, not `/auth/login`
- Reset password: `npx payload reset-password --collection users --email your@email.com`

**Q: App users trying to access /admin get "Unauthorized"**
- This is expected - app users **cannot** access `/admin`
- `/admin` requires separate admin account
- Create admin accounts via setup wizard or CLI

**Q: Want to give existing app user admin access**
- You **cannot** - these are separate systems
- Create a new admin account via `/admin` setup wizard
- Can use same email address but needs separate password

**Q: Lost admin password**
- Run: `npx payload reset-password --collection users --email admin@viapro.to`
- Or manually update `payload.users` table with new bcrypt hash

**Q: Admin session expired**
- Default: 7 days
- Configure in `payload.config.ts` under `auth.tokenExpiration`
- Just login again at `/admin`

---

**End of Migration Plan**
