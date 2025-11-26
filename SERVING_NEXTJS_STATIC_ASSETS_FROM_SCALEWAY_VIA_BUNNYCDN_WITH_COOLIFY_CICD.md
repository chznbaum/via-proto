# Serving Next.js 15 Static Assets from Scaleway via BunnyCDN with Coolify CI/CD

The complete architecture involves building Next.js in CI, uploading `_next/static` to Scaleway Object Storage, building a Docker image with standalone output, and triggering Coolify deployment—all orchestrated through CircleCI or GitHub Actions. The critical constraint: **assetPrefix is baked in at build time**, requiring separate builds for staging and production CDN URLs.

## The end-to-end deployment flow

Your pipeline will follow this sequence: **CI build → S3 upload → Docker build → Registry push → Coolify deploy**. The Next.js build must happen in CI (not Docker) because you need the `.next/static` directory to upload to Scaleway before creating the Docker image. This ordering ensures the CDN has your assets before any user hits the new deployment.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  CircleCI/GHA   │    │  Scaleway S3     │    │  BunnyCDN       │
│  npm run build  │───▶│  _next/static/   │───▶│  Pull Zone      │
└────────┬────────┘    └──────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              │
┌─────────────────┐    ┌──────────────────┐            │
│  Docker Build   │───▶│  GHCR/Registry   │            │
│  (standalone)   │    │  Push Image      │            │
└────────┬────────┘    └────────┬─────────┘            │
         │                      │                      │
         ▼                      ▼                      │
┌─────────────────────────────────────────┐            │
│          Coolify Deployment             │◀───────────┘
│  (Pulls image, serves app with CDN URLs)│
└─────────────────────────────────────────┘
```

## Next.js 15 configuration for CDN asset serving

The `assetPrefix` setting tells Next.js to prepend your CDN URL to all `/_next/static/` asset paths. With `output: 'standalone'`, this value is **permanently frozen into the build output**—you cannot change it at runtime.

**next.config.mjs:**
```javascript
// @ts-check
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

export default (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER
  
  // CDN URL must be set at BUILD time via environment variable
  const cdnUrl = process.env.CDN_URL
  
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    output: 'standalone',
    assetPrefix: isDev ? undefined : cdnUrl,
    
    // Recommended: Set long cache headers for assets served from origin
    async headers() {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
          ]
        }
      ]
    }
  }
  
  return nextConfig
}
```

**Critical constraints to understand:**

- **No trailing slash** on the CDN URL: use `https://cdn.example.com` not `https://cdn.example.com/`
- The `public/` folder is **not covered** by assetPrefix—those files must be manually prefixed or uploaded separately
- Separate builds required for staging vs production if CDN URLs differ
- Known bug in Next.js 15: CSS loading issues with `next/dynamic` and assetPrefix (GitHub #72470)

**Build commands for different environments:**
```json
{
  "scripts": {
    "build:staging": "CDN_URL=https://cdn-dev.viapro.to next build",
    "build:production": "CDN_URL=https://cdn.viapro.to next build"
  }
}
```

## Scaleway Object Storage upload configuration

Scaleway is fully S3-compatible. AWS CLI works directly with the `--endpoint-url` flag—no special SDK needed.

**Environment variables for CI:**
```bash
export AWS_ACCESS_KEY_ID=SCWXXXXXXXXXXXXXXXXX    # Scaleway access key
export AWS_SECRET_ACCESS_KEY=your-secret-key      # Scaleway secret key
export AWS_DEFAULT_REGION=nl-ams                  # fr-par, nl-ams, or pl-waw
```

**Upload script for CI pipeline:**
```bash
#!/bin/bash
set -e

ENDPOINT="https://s3.fr-par.scw.cloud"
BUCKET="your-nextjs-bucket"

# Upload _next/static with immutable cache headers
aws s3 sync .next/static s3://${BUCKET}/_next/static \
  --endpoint-url ${ENDPOINT} \
  --acl public-read \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# Optional: Upload public folder assets
aws s3 sync ./public s3://${BUCKET}/ \
  --endpoint-url ${ENDPOINT} \
  --acl public-read \
  --cache-control "public,max-age=86400"

echo "Static assets uploaded successfully"
```

**Generate Scaleway API keys:**
1. Navigate to Scaleway Console → IAM & API Keys (top-right dropdown)
2. Click Generate API Key
3. **Important**: Select "Yes, set up preferred Project" and choose the Project containing your bucket
4. Save both keys immediately—secret key shown only once

**CORS configuration (cors.json):**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com", "https://staging.yourdomain.com"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply with: `aws s3api put-bucket-cors --bucket your-bucket --cors-configuration file://cors.json --endpoint-url https://s3.fr-par.scw.cloud`

## BunnyCDN pull zone setup with Scaleway origin

Create a pull zone that fetches from your Scaleway bucket, with optional S3 authentication if the bucket isn't public.

**Pull zone configuration:**

| Setting | Value |
|---------|-------|
| Origin URL | `https://your-bucket.s3.fr-par.scw.cloud` |
| Origin Type | S3 Compatible Storage |
| S3 Authentication | Enable if bucket is private |
| Origin Shield | Enable, select Frankfurt or nearest region |
| Cache Expiration | Respect Origin Cache-Control |

**For S3 authentication** (Security → S3 Authentication):
- Access Key: Your Scaleway access key
- Secret Key: Your Scaleway secret key  
- Region Name: `fr-par`, `nl-ams`, or `pl-waw`

**Cache settings optimized for Next.js:**
- Query String Sort: **Enabled**
- Ignore Query Strings: **Enabled** (hashed filenames make query strings unnecessary)
- Stale Cache While Updating: **Enabled**
- Stale Cache While Offline: **Enabled**

**CORS for font files** (Headers section):
Enable "Add CORS Headers" with extensions: `woff, woff2, ttf, otf, eot, css, js, json`

**Cache invalidation** is rarely needed because Next.js uses content-hashed filenames. When you do need it:
```bash
# Purge entire zone
curl -X POST \
  -H "AccessKey: YOUR_BUNNY_API_KEY" \
  https://api.bunny.net/pullzone/ZONE_ID/purgeCache

# Purge specific path pattern
curl -X POST \
  -H "AccessKey: YOUR_BUNNY_API_KEY" \
  "https://api.bunny.net/purge?url=https://cdn.viapro.to/_next/static/*"
```

**Image optimization decision**: BunnyCDN Optimizer and Next.js Image component both optimize images. Running both causes double-compression. Choose one—recommend disabling Bunny Optimizer for `/_next/image/*` paths via Edge Rules, or use `unoptimized` prop on Next.js Image components if using Bunny Optimizer exclusively.

## Coolify external CI/CD integration

Coolify fully supports external CI/CD through its REST API. You can disable auto-deploy from GitHub webhooks and trigger deployments exclusively from CircleCI or GitHub Actions.

**Create API token:**
1. Go to Coolify dashboard → Keys & Tokens → API tokens
2. Generate new token with deployment permissions
3. Store securely in CI secrets

**Deployment API endpoint:**
```bash
curl --request GET \
  "https://coolify.yourdomain.com/api/v1/deploy?uuid=YOUR_RESOURCE_UUID&force=false" \
  --header "Authorization: Bearer YOUR_COOLIFY_TOKEN"
```

**Configure Coolify for pre-built images:**

Option 1: **Docker Image resource type**—specify image directly:
```
ghcr.io/your-org/your-app:latest
```

Option 2: **Docker Compose with external image**:
```yaml
# docker-compose.yml in Coolify
services:
  app:
    image: ghcr.io/your-org/your-app:${IMAGE_TAG:-latest}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

**Staging vs production environments:**
1. Create a Project in Coolify
2. Add two Environments: `staging` and `production`
3. Deploy same app to both with different:
   - Environment variables
   - Domains (staging.example.com vs app.example.com)
   - Coolify UUIDs (different webhook URLs)

**Disable GitHub auto-deploy**: Toggle off "Auto Deploy" in your resource settings to prevent GitHub webhook triggers when using external CI.

## Complete CircleCI pipeline configuration

CircleCI works well for this workflow. The AWS orbs simplify S3 interactions.

**.circleci/config.yml:**
```yaml
version: 2.1

orbs:
  node: circleci/node@5.2.0
  aws-cli: circleci/aws-cli@4.1.3

executors:
  node-executor:
    docker:
      - image: cimg/node:20.11.0
  aws-executor:
    docker:
      - image: cimg/aws:2024.03

jobs:
  build-nextjs:
    executor: node-executor
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-deps-{{ checksum "package-lock.json" }}
      - run:
          name: Install dependencies
          command: npm ci
      - save_cache:
          key: v1-deps-{{ checksum "package-lock.json" }}
          paths:
            - node_modules
      - run:
          name: Build Next.js
          command: npm run build
          environment:
            CDN_URL: << pipeline.parameters.cdn-url >>
      - persist_to_workspace:
          root: .
          paths:
            - .next
            - public
            - package.json
            - next.config.mjs

  upload-static-assets:
    executor: aws-executor
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Upload to Scaleway S3
          command: |
            aws s3 sync .next/static s3://${S3_BUCKET}/_next/static \
              --endpoint-url https://s3.fr-par.scw.cloud \
              --acl public-read \
              --cache-control "public,max-age=31536000,immutable" \
              --delete

  build-and-push-docker:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - attach_workspace:
          at: .
      - setup_remote_docker:
          version: default
      - run:
          name: Build Docker image
          command: |
            docker build -t ghcr.io/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}:${CIRCLE_SHA1} .
            docker tag ghcr.io/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}:${CIRCLE_SHA1} \
                       ghcr.io/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}:latest
      - run:
          name: Push to GitHub Container Registry
          command: |
            echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin
            docker push ghcr.io/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}:${CIRCLE_SHA1}
            docker push ghcr.io/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}:latest

  deploy-to-coolify:
    docker:
      - image: cimg/base:stable
    parameters:
      coolify-webhook:
        type: string
      coolify-token:
        type: env_var_name
    steps:
      - run:
          name: Trigger Coolify deployment
          command: |
            curl --fail --request GET "<< parameters.coolify-webhook >>" \
              --header "Authorization: Bearer ${<< parameters.coolify-token >>}"

parameters:
  cdn-url:
    type: string
    default: ""

workflows:
  staging:
    jobs:
      - build-nextjs:
          cdn-url: https://staging-cdn.b-cdn.net
          filters:
            branches:
              only: develop
      - upload-static-assets:
          requires: [build-nextjs]
          context: scaleway-staging-viaproto
      - build-and-push-docker:
          requires: [upload-static-assets]
          context: github-registry
      - deploy-to-coolify:
          requires: [build-and-push-docker]
          coolify-webhook: ${COOLIFY_STAGING_WEBHOOK}
          coolify-token: COOLIFY_STAGING_TOKEN
          context: coolify-staging

  production:
    jobs:
      - build-nextjs:
          cdn-url: https://cdn.b-cdn.net
          filters:
            branches:
              only: main
      - upload-static-assets:
          requires: [build-nextjs]
          context: scaleway-production-viaproto
      - build-and-push-docker:
          requires: [upload-static-assets]
          context: github-registry
      - deploy-to-coolify:
          requires: [build-and-push-docker]
          coolify-webhook: ${COOLIFY_PRODUCTION_WEBHOOK}
          coolify-token: COOLIFY_PRODUCTION_TOKEN
          context: coolify-production
```

**CircleCI environment variables needed:**
- `AWS_ACCESS_KEY_ID` (Scaleway key)
- `AWS_SECRET_ACCESS_KEY` (Scaleway secret)
- `S3_BUCKET`
- `GITHUB_USERNAME`
- `GITHUB_TOKEN` (with packages:write scope)
- `COOLIFY_STAGING_WEBHOOK`
- `COOLIFY_STAGING_TOKEN`
- `COOLIFY_PRODUCTION_WEBHOOK`
- `COOLIFY_PRODUCTION_TOKEN`

## GitHub Actions alternative

If you prefer GitHub Actions over CircleCI:

**.github/workflows/deploy.yml:**
```yaml
name: Build and Deploy

on:
  push:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
      cdn-url: ${{ steps.set-env.outputs.cdn-url }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set environment
        id: set-env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "cdn-url=https://cdn.b-cdn.net" >> $GITHUB_OUTPUT
          else
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "cdn-url=https://staging-cdn.b-cdn.net" >> $GITHUB_OUTPUT
          fi

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      
      - name: Build Next.js
        run: npm run build
        env:
          CDN_URL: ${{ steps.set-env.outputs.cdn-url }}

      - uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: |
            .next
            public
          retention-days: 1

  upload-static:
    needs: build
    runs-on: ubuntu-latest
    environment: ${{ needs.build.outputs.environment }}
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: nextjs-build

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.SCALEWAY_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.SCALEWAY_SECRET_KEY }}
          aws-region: fr-par

      - name: Upload to Scaleway S3
        run: |
          aws s3 sync .next/static s3://${{ secrets.S3_BUCKET }}/_next/static \
            --endpoint-url https://s3.fr-par.scw.cloud \
            --acl public-read \
            --cache-control "public,max-age=31536000,immutable" \
            --delete

  build-docker:
    needs: [build, upload-static]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: nextjs-build

      - uses: docker/setup-buildx-action@v3
      
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: [build, build-docker]
    runs-on: ubuntu-latest
    environment: ${{ needs.build.outputs.environment }}
    steps:
      - name: Deploy to Coolify
        run: |
          curl --fail --request GET "${{ secrets.COOLIFY_WEBHOOK }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

## Dockerfile for standalone Next.js deployment

This multi-stage Dockerfile assumes CI has already built Next.js and the `.next` directory exists:

```dockerfile
# Dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output from CI build artifacts
# The .next directory should be present from the CI workspace
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs public ./public

# Note: We do NOT copy .next/static - it's served from CDN
# If you need local fallback, uncomment:
# COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

**Alternative: Full build in Docker** (if you prefer not building in CI):
```dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CDN_URL must be passed as build arg
ARG CDN_URL
ENV CDN_URL=${CDN_URL}

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

## Testing in staging before production

The workflow ensures staging deploys from `develop` branch and production from `main`:

1. **Push to develop** → Builds with staging CDN URL → Uploads to staging S3 bucket → Deploys to Coolify staging environment
2. **Merge to main** → Builds with production CDN URL → Uploads to production S3 bucket → Deploys to Coolify production environment

**Coolify environment setup:**
- Create Project: "My App"
- Create Environment: "staging" with resource pointing to staging CDN
- Create Environment: "production" with resource pointing to production CDN
- Each environment has its own UUID for the webhook URL

## Conclusion: recommended architecture decisions

For your specific setup—Next.js 15.1.8 with App Router, standalone output, and Coolify—the optimal path is **CircleCI with CI-based builds**. Build Next.js in CircleCI where you control the CDN_URL environment variable, upload static assets to Scaleway, then build a minimal Docker image containing only the standalone server. This makes your deployment truly stateless.

Key implementation choices:
- **Build location**: CI (CircleCI), not Docker—enables S3 upload before containerization
- **Registry**: GitHub Container Registry (ghcr.io)—free, integrates well with both CI systems
- **Cache strategy**: Trust Next.js hashed filenames; skip CDN purging on deploys
- **Image optimization**: Pick either Bunny Optimizer OR Next.js Image, not both
- **Separate CDN URLs**: Use different Scaleway buckets and BunnyCDN zones for staging/production to avoid cache collisions

The stateless architecture is achieved because your Next.js container only serves SSR and API routes—all static assets come directly from BunnyCDN → Scaleway. Horizontal scaling becomes straightforward since no container stores local state.
