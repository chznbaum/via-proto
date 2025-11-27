# Deployment Checklist

**Last Updated:** 2025-11-27

---

## ⚠️ CRITICAL: Pre-Deployment Requirements

### Coolify Environment Variables

#### Web Service (Next.js)
**REQUIRED BEFORE PAYLOAD CMS LAUNCH:**

The web service **MUST** have `DATABASE_URL` added to its environment variables in Coolify.

```bash
# Existing variables (already configured):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENROUTER_API_KEY=
RESEND_API_KEY=
UNSPLASH_ACCESS_KEY=
NEXT_PUBLIC_SITE_URL=

# NEW REQUIREMENT FOR PAYLOAD CMS:
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Payload CMS (generate unique secret for production):
PAYLOAD_SECRET=<generate-with-crypto.randomBytes>

# Scaleway S3 (if not in CircleCI Context):
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

#### Worker Service (Background Jobs)
No changes required - already has `DATABASE_URL`.

---

## Why Both Services Need DATABASE_URL

| Service | Reason |
|---------|--------|
| **Web Service** | Payload CMS admin panel (`/admin`) requires direct Postgres connection to manage content |
| **Worker Service** | Graphile Worker needs direct Postgres connection for job queue |

Both services use the same database but for different purposes:
- **Web Service**: CMS content management (Payload schema: `payload.*`)
- **Worker Service**: Background job processing (Graphile schema: `graphile_worker.*`)

---

## Deployment Steps (When Ready)

### 1. Add Environment Variables to Coolify

**Web Service:**
```bash
# In Coolify → ViaProto Web Service → Environment Variables
DATABASE_URL=<same-value-as-worker-service>
PAYLOAD_SECRET=<generate-new-secret>
```

**Generate Production Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Run Payload Migrations

After deploying with new environment variables:

```bash
# SSH into production or use Coolify exec
npx payload migrate
```

This will create the `payload` schema in your Supabase Postgres database.

### 3. Create First Admin User

Visit: `https://viapro.to/admin`

Complete the first-time setup wizard to create your admin account.

**IMPORTANT:** This is a separate authentication system from your app's Supabase Auth.

### 4. Verify Deployment

- [ ] Admin UI loads at `/admin`
- [ ] Can login with admin credentials
- [ ] Can create a test blog post
- [ ] Images upload to Scaleway S3
- [ ] Images display via BunnyCDN
- [ ] Public blog page shows posts

---

## CircleCI Context Variables

If managing S3 credentials via CircleCI Context, ensure these are available:

```bash
AWS_ACCESS_KEY_ID=<scaleway-key>
AWS_SECRET_ACCESS_KEY=<scaleway-secret>
```

---

## Database Schema Overview

After Payload migration, your Supabase database will have:

```
public.*              (your existing app tables)
payload.*             (Payload CMS tables - NEW)
graphile_worker.*     (worker job queue - existing)
auth.*                (Supabase auth - existing)
```

The `payload` schema is completely isolated and won't interfere with your existing tables.

---

## Rollback Plan

If issues arise:

1. Remove `DATABASE_URL` from web service environment
2. Drop Payload schema: `DROP SCHEMA payload CASCADE;`
3. Revert code changes
4. Redeploy

---

## Support

Questions about this deployment? Check:
- `PAYLOAD_MIGRATION_PLAN.md` - Full migration guide
- `CLAUDE.md` - Project architecture overview
