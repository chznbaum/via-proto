-- Migration: Add notes about embedding management
-- Purpose: Document how to maintain embeddings for topics
-- Date: 2025-11-24

-- Add comment to topics table explaining embedding workflow
COMMENT ON TABLE public.topics IS
'Pre-seeded learning topics. Embeddings are generated via scripts/backfill-topic-embeddings.ts. When adding new topics via migrations, run: npx tsx scripts/backfill-topic-embeddings.ts';

-- Note: We don't use triggers for embedding generation because:
-- 1. Topics are admin-only and added via migrations/scripts, not user actions
-- 2. Embeddings require external API calls (OpenAI) which can't be done in PostgreSQL triggers without extensions
-- 3. Running the backfill script after adding topics is simpler and more reliable
-- 4. Embedding generation is idempotent (only processes topics with NULL embedding)
