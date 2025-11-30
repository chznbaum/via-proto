FROM node:24-alpine AS base

# Install dependencies for worker
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy pre-built standalone output from CI
# The .next directory is built in CI and passed via workspace
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs public ./public

# Note: .next/static is NOT copied - it's served from CDN
# If you need local fallback, uncomment:
# COPY --chown=nextjs:nodejs .next/static ./.next/static

# Copy worker, libs, scripts, and TypeScript config for tsx
COPY --chown=nextjs:nodejs worker.ts ./worker.ts
COPY --chown=nextjs:nodejs libs ./libs
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs types ./types
COPY --chown=nextjs:nodejs tsconfig.json ./tsconfig.json
COPY --chown=nextjs:nodejs package.json ./package.json

# Copy node_modules for worker dependencies (tsx, graphile-worker, etc.)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy SSL certificate for Supabase connection
COPY --chown=nextjs:nodejs certs ./certs

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_EXTRA_CA_CERTS="/app/certs/prod-ca-2021.crt"

# Use entrypoint script - set RUN_MODE=worker for worker service
ENTRYPOINT ["./docker-entrypoint.sh"]
