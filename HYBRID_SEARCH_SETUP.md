# Hybrid Semantic Search Setup Guide

This document explains the hybrid search implementation that combines semantic similarity, keyword matching, and prefix autocomplete for optimal topic search.

## Architecture Overview

**Hybrid search is now enabled for both Topics and Competencies!**

### Search Components

The hybrid search combines three scoring mechanisms:

1. **Semantic Similarity (30% weight)** - Conceptual relevance via embeddings
   - Uses OpenAI text-embedding-3-small (1536 dimensions)
   - Captures meaning: "machine learning" matches "neural networks"
   - Powered by pgvector cosine similarity

2. **Keyword Relevance (50% weight)** - Weighted tsvector search
   - A-weight: Topic names (highest priority)
   - B-weight: Competency names + synonyms
   - C-weight: Descriptions
   - D-weight: Tags
   - PostgreSQL full-text search with stemming

3. **Prefix Matching (20% weight)** - Autocomplete boost
   - Exact name match = 1.0 score
   - Prefix match = 0.5 score
   - Provides instant feedback for typeahead

### Why This Approach?

- **Semantic**: Handles conceptual queries ("how to build websites" → "web development")
- **Keyword**: Fast, weighted search across names, synonyms, descriptions
- **Prefix**: Instant autocomplete feel for typing experience
- **Hybrid**: Best of all worlds - catches both exact matches and related concepts

## Setup Instructions

### 1. Environment Variables

Add to your `.env`:

```bash
# OpenRouter: For AI path generation (existing)
OPENROUTER_API_KEY=your_openrouter_key

# OpenAI: For embeddings (NEW)
OPENAI_API_KEY=your_openai_key
```

**Why separate keys?**
- OpenRouter: Chat completions (40+ models)
- OpenAI: Embeddings only (cost-effective, industry standard)

### 2. Run Migrations

Apply the new migrations that add pgvector support:

```bash
# Push migrations to database
supabase db push

# Migrations applied:
# - 20251124190000_add_pgvector_embeddings.sql (pgvector + embedding column)
# - 20251124190001_create_hybrid_search_function.sql (hybrid search function)
# - 20251124190002_add_embedding_notes.sql (documentation)
```

### 3. Backfill Embeddings

Generate embeddings for topics and/or competencies:

```bash
# Topics only (default)
npm run embeddings:backfill

# Competencies only
npm run embeddings:backfill -- --type=competencies

# Both topics and competencies
npm run embeddings:backfill -- --type=all
```

**Expected output:**
```
🚀 Starting embedding backfill...
📋 Type: all

📚 Processing topics...
📥 Fetching topics without embeddings...
✅ Found 3000 topics to process

🔄 Processing batch 1/60 (50 topics)...
   Generating embeddings...
   Updating database...
   ✅ Batch complete (50/3000 total)

...

✨ Topics backfill complete! Processed 3000/3000 topics
💰 Estimated cost: $0.3000

────────────────────────────────────────────────────────────────

🎯 Processing competencies...
📥 Fetching competencies without embeddings...
✅ Found 250 competencies to process

🔄 Processing batch 1/5 (50 competencies)...
   Generating embeddings...
   Updating database...
   ✅ Batch complete (50/250 total)

...

✨ Competencies backfill complete! Processed 250/250 competencies
💰 Estimated cost: $0.0375

🎉 All done! Total processed: 3250
```

**Cost**:
- Topics: ~$0.30 for 3000 topics
- Competencies: ~$0.04 for 250 competencies
- **Total one-time cost: ~$0.34**

### 4. Test the Search

The APIs automatically use hybrid search - no frontend changes needed!

```bash
# Test topic search
curl "http://localhost:3001/api/search?q=machine%20learning&limit=10"

# Test competency search
curl "http://localhost:3001/api/competencies?q=frontend&limit=10"
```

**Response includes debug info:**
```json
{
  "results": [
    {
      "topic_name": "Machine Learning",
      "rank": 0.92,           // Combined score
      "semantic_score": 0.95, // Embedding similarity
      "keyword_score": 0.88,  // TSVector relevance
      "prefix_score": 0.0,    // Exact/prefix match
      ...
    }
  ]
}
```

## File Structure

### New Files

```
libs/
└── embeddings.ts              # Embedding generation utilities

scripts/
└── backfill-topic-embeddings.ts  # Backfill script for topics & competencies

supabase/migrations/
├── 20251124190000_add_pgvector_embeddings.sql       # pgvector + topics
├── 20251124190001_create_hybrid_search_function.sql # Topics hybrid search
├── 20251124190002_add_embedding_notes.sql           # Documentation
├── 20251124200000_add_competency_embeddings.sql     # Competency embeddings
└── 20251124200001_create_competency_hybrid_search.sql # Competency hybrid search
```

### Modified Files

```
app/api/search/route.ts         # Topics: Now uses hybrid search
app/api/competencies/route.ts   # Competencies: Now uses hybrid search
package.json                     # Added embeddings:backfill script
.env.example                     # Added OPENAI_API_KEY
```

## Maintenance

### Adding New Topics or Competencies

When adding new items via migrations:

1. Add topics/competencies to migration SQL
2. Run `supabase db push`
3. Run the appropriate backfill command:
   ```bash
   # Topics only
   npm run embeddings:backfill

   # Competencies only
   npm run embeddings:backfill -- --type=competencies

   # Both
   npm run embeddings:backfill -- --type=all
   ```

The backfill script is idempotent - it only processes items with NULL embeddings.

### Updating Existing Data

If you change names or descriptions and want to refresh embeddings:

```sql
-- Reset topic embeddings
UPDATE public.topics
SET embedding = NULL
WHERE name LIKE 'React%';

-- Reset competency embeddings
UPDATE public.competencies
SET embedding = NULL
WHERE name LIKE 'JavaScript%';
```

Then run the appropriate backfill command.

### Monitoring Costs

**Search queries**: ~$0.0001 per query (embedding generation)
- 10,000 searches = ~$1.00
- 100,000 searches = ~$10.00

**Tips to reduce costs:**
- Cache embeddings for common queries (future enhancement)
- Implement query debouncing (already done: 300ms)
- Consider caching popular search results

## Performance

### Search Latency

- **Embedding generation**: ~50-100ms (OpenAI API)
- **Database query**: ~10-50ms (pgvector + GIN indexes)
- **Total**: ~100-150ms (acceptable for typeahead)

### Optimizations

Already implemented:
- HNSW index for vector similarity (faster than IVFFlat)
- GIN index for tsvector search
- 300ms debounce on frontend
- Batch embedding generation (backfill)

Future enhancements:
- Redis cache for common queries
- Pre-compute embeddings for top 100 queries
- Edge caching with CDN

## Tuning Weights

Current weights in `search_topics_hybrid()`:

```sql
semantic_weight := 0.3;  -- Conceptual relevance
keyword_weight  := 0.5;  -- Keyword matching
prefix_weight   := 0.2;  -- Autocomplete boost
```

**To adjust weights:**

1. Edit `supabase/migrations/20251124190001_create_hybrid_search_function.sql`
2. Change the weight constants
3. Run `supabase db push`
4. Test with `SELECT * FROM search_topics_hybrid('test query', '[embedding vector]', 10)`

**Weight tuning tips:**
- Increase `prefix_weight` for more autocomplete feel
- Increase `semantic_weight` for more conceptual matching
- Increase `keyword_weight` for more exact matches
- Weights must sum to 1.0

## Troubleshooting

### "No results" for conceptual queries

**Issue**: Searching "AI" doesn't find "Machine Learning"

**Solution**: Embeddings might not be generated. Run:
```bash
npm run embeddings:backfill
```

### "OPENAI_API_KEY not found"

**Issue**: Environment variable missing

**Solution**:
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Restart server

### Slow search performance

**Issue**: Queries taking > 500ms

**Solution**:
1. Check indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'topics';
   ```
2. Verify pgvector index: `idx_topics_embedding_hnsw`
3. Check embedding dimension matches (1536)

### High costs

**Issue**: OpenAI bill is high

**Solution**:
1. Check query volume in logs
2. Implement query result caching
3. Consider rate limiting per user
4. Use OpenAI's usage dashboard to track costs

## Comparison: Before vs After

### Before (TSVector only)

✅ Fast keyword matching
✅ Weighted priority (name > description > tags)
✅ Synonym support
❌ No conceptual understanding
❌ No autocomplete boost
❌ Exact keyword matches only

### After (Hybrid)

✅ All benefits of tsvector
✅ Conceptual/semantic matching
✅ Autocomplete feel with prefix boost
✅ Better ranking relevance
⚠️ Slight latency increase (~100ms)
⚠️ Small API cost per search (~$0.0001)

## Future Enhancements

1. **Query caching**: Redis cache for embeddings of common queries
2. **A/B testing**: Track relevance metrics to tune weights
3. **User feedback**: "Was this result helpful?" to improve ranking
4. **Advanced filters**: Filter by competencies, tags, difficulty
5. **Multi-language**: Support embeddings in other languages
6. **Related topics**: "Users who searched X also viewed Y"

## Questions?

See:
- `libs/embeddings.ts` - Embedding utility documentation
- `supabase/migrations/20251124190001_create_hybrid_search_function.sql` - SQL function
- [pgvector docs](https://github.com/pgvector/pgvector)
- [OpenAI embeddings guide](https://platform.openai.com/docs/guides/embeddings)
