# Post-Launch Security Tasks

## Context
This is a prioritized security task list for ViaProto post-MVP launch. Tasks are organized by timeline based on user growth and risk exposure.

---

## Week 1-2 (First 100 Users)

### Priority 1: Basic Hardening (2-3 hours total)

- [ ] **Environment Variable Validation** (30 min)
  - Add startup checks in `worker.ts` and app initialization
  - Verify `STRIPE_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set
  - Location: Top of `worker.ts` and create `libs/env-validation.ts`

- [ ] **SameSite Cookie Configuration** (15 min)
  - Set `sameSite: 'lax'` and `secure: true` (production) on session cookies
  - Location: `libs/supabase/server.ts:19-23`
  - Location: `app/api/auth/callback/route.ts:34-38`

- [ ] **Path Deletion Ownership Check** (30 min)
  - Verify only path creator or account admin can delete paths
  - Location: `app/api/paths/[id]/route.ts:202-215` (DELETE handler)
  - Apply same logic to PATCH handler at lines 75-163

- [ ] **Basic Monitoring Setup** (1 hour)
  - Set up Stripe webhook failure alerts
  - Monitor unusual path creation patterns (>10 paths from one user in 24h)
  - Track OpenRouter API costs daily
  - Set up Supabase dashboard alerts for error spikes

---

## Month 1 (100-500 Users)

### Priority 2: Payment Security (3-4 hours)

- [ ] **Stripe Webhook Signature Verification** (1 hour)
  - Add check for missing `stripe-signature` header
  - Validate `STRIPE_WEBHOOK_SECRET` is defined before processing
  - Location: `app/api/webhook/stripe/route.ts:35-38`

- [ ] **Stripe Webhook Account Validation** (1.5 hours)
  - Verify account exists before updates
  - Prevent `stripe_customer_id` hijacking (check existing customer ID matches)
  - Add audit logging for webhook operations
  - Location: `app/api/webhook/stripe/route.ts:28-31` and event handlers

- [ ] **Webhook Event Deduplication** (1 hour)
  - Store processed webhook event IDs in database
  - Prevent replay attacks
  - Create `webhook_events` table with unique constraint on `stripe_event_id`

### Priority 3: CSRF Protection (2-3 hours)

- [ ] **CSRF Token Implementation** (2-3 hours)
  - Create `libs/csrf.ts` with token generation/validation
  - Add CSRF token validation to all POST/PATCH/DELETE routes:
    - `/api/paths/initiate`
    - `/api/paths/[id]` (PATCH, DELETE)
    - `/api/user-competencies` (POST, DELETE)
    - `/api/stripe/create-checkout`
    - `/api/stripe/create-portal`
  - Add token endpoint: `/api/csrf-token` (GET)
  - Update client-side forms to include CSRF token

---

## Month 2-3 (500-1000 Users)

### Priority 4: Rate Limiting & Abuse Prevention (4-5 hours)

- [ ] **User-Level Quota Tracking** (2 hours)
  - Prevent rate limit bypass via account switching
  - Add per-user monthly path count check for personal accounts
  - Location: `app/api/paths/initiate/route.ts:34-90`

- [ ] **Public Endpoint Rate Limiting** (2 hours)
  - Set up Upstash Redis or Vercel Edge Config
  - Add rate limiting to:
    - `/api/search` (100 req/10min per IP)
    - `/api/topics` (200 req/10min per IP)
  - Create `libs/rate-limit.ts` utility

- [ ] **Input Validation Enhancement** (1 hour)
  - Add Zod schema validation to all API endpoints lacking it
  - Verify `competency_id` exists in `competencies` table before insert
  - Location: `app/api/user-competencies/route.ts:79-96`

---

## Month 3-6 (1000+ Users / Pre-Marketing Push)

### Priority 5: Production Hardening (6-8 hours)

- [ ] **Audit Logging System** (3 hours)
  - Create `audit_logs` table (see SQL below)
  - Log critical operations:
    - Account upgrades/downgrades
    - Path deletions
    - Subscription changes
    - Service role operations
    - Failed auth attempts
  - Create admin dashboard to view logs

- [ ] **Security Headers** (1 hour)
  - Add security headers to `next.config.js`:
    - `Strict-Transport-Security`
    - `X-Frame-Options`
    - `X-Content-Type-Options`
    - `Content-Security-Policy` (staged rollout)
  - Test with https://securityheaders.com

- [ ] **Error Handling Standardization** (2 hours)
  - Create `libs/error-handler.ts` with sanitized production errors
  - Remove internal implementation details from error messages
  - Use error codes instead of descriptive messages
  - Keep detailed logging server-side only

- [ ] **OpenRouter API Key Protection** (1 hour)
  - Add log sanitization to prevent API key leaks
  - Create `libs/logger.ts` with pattern-based redaction
  - Apply to all worker tasks in `libs/jobs/tasks/*.ts`

- [ ] **Database Connection Security** (30 min)
  - Verify `DATABASE_URL` uses `?sslmode=require`
  - Test connection with SSL enforcement
  - Document in deployment guide

---

## Ongoing / As Needed

### Maintenance Tasks

- [ ] **Weekly Dependency Audits**
  - Run `npm audit` weekly
  - Update dependencies monthly
  - Monitor GitHub Dependabot alerts

- [ ] **Monthly Security Reviews**
  - Review Stripe dashboard for anomalies
  - Check audit logs for suspicious patterns
  - Verify RLS policies with test cases
  - Review OpenRouter API usage and costs

- [ ] **Quarterly Third-Party Reviews**
  - Consider professional penetration testing at 5K+ users
  - Review compliance requirements (GDPR, SOC 2) before Series A
  - Update security documentation

---

## Compliance Roadmap (When Revenue > $50K MRR)

### GDPR Compliance (EU Users)
- [ ] Implement `/api/user/export-data` endpoint (data portability)
- [ ] Implement `/api/user/delete-account` endpoint (right to erasure)
- [ ] Add cookie consent banner for EU visitors
- [ ] Update privacy policy with detailed data processing info
- [ ] Appoint DPO if required (250+ employees or high-risk processing)

### SOC 2 Type II (Enterprise Sales)
- [ ] Implement comprehensive audit logging
- [ ] Create access control review process
- [ ] Document incident response plan
- [ ] Annual third-party security assessment
- [ ] Encrypt data at rest (Supabase default, verify)

### PCI-DSS (Already Compliant via Stripe)
- [ ] Maintain SAQ A compliance (Stripe handles all card data)
- [ ] Never store card numbers, CVVs, or full PANs
- [ ] Annual attestation of compliance
- [ ] Quarterly network scans (if applicable)

---

## Critical Incidents (Immediate Response)

If any of these occur, drop everything and respond:

1. **Stripe webhook failures >10% for 1 hour**
   - Check `STRIPE_WEBHOOK_SECRET` configuration
   - Verify endpoint is accessible: `curl https://viapro.to/api/webhook/stripe`
   - Review Stripe dashboard for error details

2. **Unusual subscription activity**
   - Compare Stripe active subscriptions to database `accounts` table
   - Check for customer ID mismatches
   - Review recent webhook events

3. **OpenRouter API cost spike (>$100/day unexpected)**
   - Check for quota bypass attempts
   - Review recent path generation patterns
   - Verify rate limiting is enforced

4. **User reports unauthorized path creation/deletion**
   - Immediately review RLS policies
   - Check for CSRF exploitation
   - Audit user session activity
   - Consider forcing password reset if widespread

5. **Supabase service role key exposure**
   - Rotate key immediately in Supabase dashboard
   - Update environment variables in production
   - Restart all services (web + worker)
   - Audit all database changes in last 24 hours

---

## SQL: Audit Logging Table

```sql
-- Add to new migration when implementing audit logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_account_id ON audit_logs(account_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Example usage in webhook handler
INSERT INTO audit_logs (account_id, action, resource_type, resource_id, metadata)
VALUES (
  'account-uuid',
  'subscription_updated',
  'account',
  'account-uuid',
  '{"stripe_event_id": "evt_123", "new_tier": "pro"}'::jsonb
);
```

---

## Testing Checklist (Before Each Security Fix)

When implementing any security fix, test:

- [ ] Functionality still works for authorized users
- [ ] Unauthorized access is properly blocked
- [ ] Error messages don't leak sensitive info
- [ ] Logs capture the security event
- [ ] Performance impact is minimal (<50ms added latency)
- [ ] Edge cases handled (expired sessions, invalid tokens, etc.)

---

## Resources

- **Stripe Webhook Testing**: `stripe listen --forward-to localhost:3001/api/webhook/stripe`
- **Supabase RLS Testing**: Use test suite with multiple user contexts
- **Security Headers Check**: https://securityheaders.com
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/configuring/security-headers

---

## Notes

- This list assumes steady growth from 100 → 1000+ users over 3-6 months
- Adjust timelines based on actual growth rate
- If you get sudden traction (e.g., viral post, press coverage), immediately implement Month 1 tasks
- Budget ~1-2 hours/week for security maintenance at MVP scale
- Budget ~4-6 hours/week for security at 1000+ users

**Last Updated**: 2025-11-24
