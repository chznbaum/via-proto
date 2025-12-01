# TinaCMS Integration Research

Research conducted 2025-11-30 for ViaProto blog integration.

## Compatibility Status

TinaCMS has completed Next.js 15 support (GitHub issue #5244 closed). React 19 is now supported.

## What TinaCMS Provides

- Git-based content: Markdown/MDX files stored in repo
- Visual editing: Live preview at `/admin/index.html`
- Self-hosted option: TinaCloud (hosted) or self-host GraphQL backend
- MDX support: Already have `@mdx-js/loader` and `@next/mdx` installed

## Integration Steps

### 1. Install and Initialize

```bash
npx @tinacms/cli@latest init
```

Creates:
- `tina/config.ts` - Schema and collection definitions
- `tina/__generated__/` - Generated types and GraphQL client

### 2. Update package.json Scripts

Current:
```json
"dev": "next dev -p 3001"
```

Becomes:
```json
"dev": "tinacms dev -c \"next dev -p 3001\"",
"build": "tinacms build && next build",
"start": "tinacms build && next start"
```

### 3. Create Content Schema (tina/config.ts)

```typescript
import { defineConfig } from "tinacms";

export default defineConfig({
  branch: process.env.TINA_BRANCH || "main",
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "post",
        label: "Blog Posts",
        path: "content/posts",
        format: "mdx",
        fields: [
          { type: "string", name: "title", label: "Title", required: true },
          { type: "string", name: "description", label: "Description" },
          { type: "datetime", name: "date", label: "Date" },
          { type: "image", name: "coverImage", label: "Cover Image" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
```

### 4. Create Blog Routes

**Server Component** (`app/(main)/blog/[slug]/page.tsx`):
```typescript
import { client } from "@/tina/__generated__/client";
import ClientPage from "./client-page";

export async function generateStaticParams() {
  const posts = await client.queries.postConnection();
  return posts.data.postConnection.edges?.map((edge) => ({
    slug: edge?.node?._sys.filename,
  })) || [];
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, query, variables } = await client.queries.post({
    relativePath: `${slug}.mdx`,
  });
  return <ClientPage data={data} query={query} variables={variables} />;
}
```

**Client Component** (`app/(main)/blog/[slug]/client-page.tsx`):
```typescript
"use client";
import { useTina } from "tinacms/dist/react";

export default function ClientPage({ data, query, variables }) {
  const { data: tinaData } = useTina({ query, variables, data });
  // Render post content with live editing
}
```

### 5. Environment Variables

Add to `.env`:
```bash
# TinaCMS (optional - only needed for TinaCloud hosting)
TINA_CLIENT_ID=
TINA_TOKEN=
TINA_BRANCH=main
```

## Files/Directories Created

```
tina/
├── config.ts              # Schema configuration
└── __generated__/         # Auto-generated types & client

content/
└── posts/                 # MDX blog posts stored here
    └── my-first-post.mdx

app/(main)/blog/
├── page.tsx               # Blog listing (update existing)
└── [slug]/
    ├── page.tsx           # Server component
    └── client-page.tsx    # Client component for editing
```

## Key Considerations

| Aspect | Details |
|--------|---------|
| Content Storage | MDX files in `content/posts/` committed to Git |
| Hosting Options | TinaCloud (free tier available) or self-hosted |
| Caching Issues | Next.js App Router aggressively caches - may need `revalidate` config |
| Worker Impact | None - TinaCMS is independent of Graphile Worker |
| Build Time | Adds `tinacms build` step (~10-30s) |

## Comparison to Payload

| | Payload | TinaCMS |
|--|---------|---------|
| Database | Requires MongoDB/Postgres | Git-based (no DB) |
| Complexity | Full backend CMS | Lightweight, content-focused |
| Editing | Admin panel | Visual inline editing |
| Self-hosting | Required | Optional (TinaCloud available) |
| React Version | Had issues with React 19 | Now supports React 19 |

TinaCMS is simpler since it's Git-based and doesn't require a separate database or backend service.

## References

- https://tina.io/docs/frameworks/next/app-router
- https://github.com/tinacms/tinacms/issues/5244
- https://tina.io/nextjs-cms
