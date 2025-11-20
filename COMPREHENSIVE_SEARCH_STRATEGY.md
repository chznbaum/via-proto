# Comprehensive Search Strategy with Full-Text Search

**Date:** November 20, 2025
**Status:** Design Complete - Ready for Implementation
**Related:** DATA_MODEL_MIGRATION_ANALYSIS.md

---

## Overview

Design a unified search system using a **single denormalized search vector on the topics table** with weighted fields:
- **A-weight:** Topic name (highest priority)
- **B-weight:** Competency names, competency synonyms
- **C-weight:** Topic description
- **D-weight:** Tags

This approach is simpler, faster, and more maintainable than searching across multiple tables.

---

## Database Schema Changes

### 1. Add Weighted Search Vector to Topics

```sql
-- Migration: Add weighted search vector to topics
-- File: supabase/migrations/YYYYMMDD_add_topic_search_vector.sql

-- Add search vector to topics
ALTER TABLE public.topics
ADD COLUMN search_vector tsvector;

-- Create GIN index for fast search
CREATE INDEX idx_topics_search_vector
ON public.topics USING GIN(search_vector);

-- Add comment
COMMENT ON COLUMN public.topics.search_vector IS
'Weighted full-text search vector: A=topic name, B=competency names+synonyms, C=description, D=tags';
```

---

## Trigger Function to Build Search Vector

### Single Comprehensive Trigger

```sql
-- Function to build the complete search vector for a topic
CREATE OR REPLACE FUNCTION public.update_topic_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    competency_names text := '';
    competency_synonyms text := '';
    topic_tags text := '';
BEGIN
    -- Get all competency names for this topic
    SELECT string_agg(c.name, ' ')
    INTO competency_names
    FROM public.topic_competencies tc
    INNER JOIN public.competencies c ON tc.competency_id = c.id
    WHERE tc.topic_id = NEW.id;

    -- Get all competency synonyms for this topic
    SELECT string_agg(cs.synonym, ' ')
    INTO competency_synonyms
    FROM public.topic_competencies tc
    INNER JOIN public.competency_synonyms cs ON tc.competency_id = cs.competency_id
    WHERE tc.topic_id = NEW.id;

    -- Get all tags for this topic
    SELECT string_agg(tag.name, ' ')
    INTO topic_tags
    FROM public.taggables tg
    INNER JOIN public.tags tag ON tg.tag_id = tag.id
    WHERE tg.taggable_id = NEW.id
      AND tg.taggable_type = 'topic'
      AND tag.is_active = true;

    -- Build weighted search vector
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(competency_names, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(competency_synonyms, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(topic_tags, '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on topic insert/update
CREATE TRIGGER topic_search_vector_update
BEFORE INSERT OR UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_search_vector();

-- Update topic search vector when topic_competencies change
CREATE OR REPLACE FUNCTION public.update_topic_on_competency_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Touch the topic to trigger search_vector rebuild
    UPDATE public.topics
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER topic_competencies_change
AFTER INSERT OR UPDATE OR DELETE ON public.topic_competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_on_competency_change();

-- Update topic search vector when competency name changes
CREATE OR REPLACE FUNCTION public.update_topics_on_competency_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only rebuild if name changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE public.topics
        SET updated_at = NOW()
        WHERE id IN (
            SELECT topic_id
            FROM public.topic_competencies
            WHERE competency_id = NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competency_name_change
AFTER UPDATE ON public.competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_topics_on_competency_update();

-- Update topic search vector when competency synonyms change
CREATE OR REPLACE FUNCTION public.update_topics_on_synonym_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.topics
    SET updated_at = NOW()
    WHERE id IN (
        SELECT topic_id
        FROM public.topic_competencies
        WHERE competency_id = COALESCE(NEW.competency_id, OLD.competency_id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER synonym_change
AFTER INSERT OR UPDATE OR DELETE ON public.competency_synonyms
FOR EACH ROW
EXECUTE FUNCTION public.update_topics_on_synonym_change();

-- Update topic search vector when tags change
CREATE OR REPLACE FUNCTION public.update_topic_on_tag_change()
RETURNS TRIGGER AS $$
BEGIN
    IF COALESCE(NEW.taggable_type, OLD.taggable_type) = 'topic' THEN
        UPDATE public.topics
        SET updated_at = NOW()
        WHERE id = COALESCE(NEW.taggable_id, OLD.taggable_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taggable_change
AFTER INSERT OR UPDATE OR DELETE ON public.taggables
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_on_tag_change();

-- Backfill search vectors for existing topics
UPDATE public.topics SET updated_at = updated_at;
```

---

## Search Function

### Simple, Fast Query

```sql
-- Migration: Create unified search function
-- File: supabase/migrations/YYYYMMDD_create_unified_search.sql

CREATE OR REPLACE FUNCTION public.search_topics_unified(
    search_query text,
    result_limit integer DEFAULT 10,
    filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    topic_id uuid,
    topic_name text,
    topic_slug text,
    topic_description text,
    category_id uuid,
    rank real,
    primary_competency_name text,
    primary_competency_slug text,
    all_competency_names text[],
    tags text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as topic_id,
        t.name as topic_name,
        t.slug as topic_slug,
        t.description as topic_description,
        t.category_id,
        ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank,
        -- Primary competency
        (SELECT c.name
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id AND tc.is_primary = true
         LIMIT 1) as primary_competency_name,
        (SELECT c.slug
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id AND tc.is_primary = true
         LIMIT 1) as primary_competency_slug,
        -- All competencies
        (SELECT array_agg(c.name ORDER BY tc.is_primary DESC, c.name)
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id) as all_competency_names,
        -- All tags
        (SELECT array_agg(tag.name ORDER BY tag.name)
         FROM public.taggables tg
         INNER JOIN public.tags tag ON tg.tag_id = tag.id
         WHERE tg.taggable_id = t.id
           AND tg.taggable_type = 'topic'
           AND tag.is_active = true) as tags
    FROM public.topics t
    WHERE
        t.is_active = true
        AND t.search_vector @@ websearch_to_tsquery('english', search_query)
        AND (filter_category_id IS NULL OR t.category_id = filter_category_id)
    ORDER BY rank DESC, t.name
    LIMIT result_limit;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.search_topics_unified IS
'Search topics using weighted tsvector (A=name, B=competencies+synonyms, C=description, D=tags). Uses websearch_to_tsquery for natural query parsing.';
```

**Key Points:**
- Uses `websearch_to_tsquery()` instead of `plainto_tsquery()` - supports quoted phrases, AND/OR operators
- Single table scan with GIN index = very fast
- Weighted ranking automatically prioritizes topic name matches over tag matches
- Simple ORDER BY rank DESC

---

## API Endpoint

### `/api/search/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/search
 * Unified search across topics, competencies, and tags
 * Query params:
 * - q: search query (required)
 * - limit: max results (default 10, max 50)
 * - category_id: filter by category UUID
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = req.nextUrl;

    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const categoryId = searchParams.get('category_id');

    // Require search query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Call unified search function
    const { data: results, error } = await supabase.rpc('search_topics_unified', {
      search_query: query.trim(),
      result_limit: limit,
      filter_category_id: categoryId || null,
    });

    if (error) {
      console.error('Error in unified search:', error);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: results || [],
      query: query.trim(),
      count: results?.length || 0
    });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Frontend TypeScript Types

```typescript
// types/search.ts

export interface SearchResult {
  topic_id: string;
  topic_name: string;
  topic_slug: string;
  topic_description: string;
  category_id: string;
  rank: number;
  primary_competency_name: string | null;
  primary_competency_slug: string | null;
  all_competency_names: string[] | null;
  tags: string[] | null;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}
```

---

## Frontend Search Component Display

**Search Result Display:**
```
┌─────────────────────────────────────────────────┐
│ 🔍 React                                        │
├─────────────────────────────────────────────────┤
│ 📘 Building interactive UIs with React          │
│    React • JavaScript • HTML • CSS             │
│    Learn to create dynamic, interactive...      │
│                                                  │
│ 📘 Creating SPAs with React Router              │
│    React • React Router • JavaScript            │
│    Build single-page applications with...       │
│                                                  │
│ 📘 State management with Redux                  │
│    Redux • React • JavaScript                   │
│    Master state management in React apps...     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔍 Minecraft redstone                           │
├─────────────────────────────────────────────────┤
│ 📘 Redstone automation in Minecraft             │
│    Learn to create automated systems...         │
│    🏷️ gaming • beginner                         │
└─────────────────────────────────────────────────┘
```

**Key Display Elements:**
1. **Rank-based ordering** - Better matches appear first automatically
2. **Competency chips** - Show all competencies (primary first)
3. **Tags** - Show as colored badges below
4. **Description preview** - Truncated with "..."

---

## Search Weighting Explained

### Weight Hierarchy (A > B > C > D)

1. **A-weight (Highest):** Topic name
   - Query "React" → "Building UIs with React" ranks higher than description mentions

2. **B-weight (High):** Competency names + competency synonyms
   - Query "React" → Topics with React competency rank high even if name doesn't mention it
   - Query "ReactJS" (synonym) → Still finds React topics

3. **C-weight (Medium):** Topic description
   - Description mentions boost relevance

4. **D-weight (Lowest):** Tags
   - Query "beginner" → Tagged topics appear but ranked lower than name/competency matches

### Example Ranking

Query: **"React"**

Result order (high to low):
1. **"React Fundamentals"** (A-weight: exact name match)
2. **"Building UIs with React"** (A-weight: name match)
3. **"Modern Frontend Development"** (B-weight: React competency)
4. **"Web Development with JavaScript"** (C-weight: mentions React in description)
5. **"JavaScript Basics"** (D-weight: tagged "react-prerequisite")

---

## Migration Checklist

### Phase 1: Database Setup (1 hour)
- [ ] Create migration: Add search_vector column to topics
- [ ] Create GIN index on search vector
- [ ] Create trigger function `update_topic_search_vector()`
- [ ] Create trigger on topics INSERT/UPDATE
- [ ] Create triggers for topic_competencies changes
- [ ] Create triggers for competencies name changes
- [ ] Create triggers for competency_synonyms changes
- [ ] Create triggers for taggables changes
- [ ] Backfill existing topics (run UPDATE)
- [ ] Create `search_topics_unified()` function

### Phase 2: API Layer (30 minutes)
- [ ] Create `/api/search/route.ts`
- [ ] Add TypeScript types for search results
- [ ] Test API with various queries

### Phase 3: Frontend (1.5 hours)
- [ ] Update TypeaheadSearch component to use `/api/search`
- [ ] Display competencies as chips
- [ ] Display tags as badges
- [ ] Add empty state handling
- [ ] Add loading state

### Phase 4: Testing (1 hour)
- [ ] Test: "React" → React topics (competency match)
- [ ] Test: "ReactJS" → React topics (synonym match)
- [ ] Test: "Minecraft" → Minecraft topics (direct name match)
- [ ] Test: "beginner" → Tagged topics (tag match)
- [ ] Test: "web apps" → Description matches
- [ ] Test with category filters
- [ ] Test empty results
- [ ] Performance test (should be < 50ms)

### Phase 5: Cleanup
- [ ] Deprecate old `/api/topics` endpoint (keep for backward compat initially)
- [ ] Remove old `search_topics()` RPC function
- [ ] Update documentation

---

## Performance Characteristics

### Expected Performance
- **Query time:** < 20ms for typical searches (single GIN index lookup)
- **Index size:** ~10% of topics table size
- **Update overhead:** ~10-20ms per topic update (rebuilds search_vector)

### Why This Is Fast
1. **Single table scan** - No joins during search
2. **GIN index** - Optimized for tsvector queries
3. **Denormalized data** - Pre-computed search content
4. **Weighted ranking** - PostgreSQL handles ranking efficiently

### Trade-offs
✅ **Pros:**
- Very fast searches (< 20ms)
- Simple query logic
- Easy to understand and debug
- Natural ranking with weights

⚠️ **Cons:**
- Search vector updates on related table changes (competencies, synonyms, tags)
- Slightly more complex trigger logic
- Denormalized data (but negligible storage cost)

The trade-off is worth it - search performance matters more than update performance for this use case.

---

## Testing Examples

```bash
# Search for competency
curl "http://localhost:3001/api/search?q=react&limit=10"

# Search for synonym
curl "http://localhost:3001/api/search?q=reactjs&limit=10"

# Search for topic directly
curl "http://localhost:3001/api/search?q=minecraft+redstone&limit=10"

# Search with category filter
curl "http://localhost:3001/api/search?q=python&category_id=<uuid>&limit=10"

# Search for tag
curl "http://localhost:3001/api/search?q=beginner&limit=10"

# Description search
curl "http://localhost:3001/api/search?q=web+applications&limit=10"

# Advanced: quoted phrase
curl "http://localhost:3001/api/search?q=\"machine+learning\"&limit=10"

# Advanced: OR operator
curl "http://localhost:3001/api/search?q=react+OR+vue&limit=10"
```

---

## Future Enhancements

### 1. Search Suggestions (Autocomplete)
Show suggestions as user types:
```sql
-- Match prefix for autocomplete
WHERE t.name ILIKE search_query || '%'
ORDER BY similarity(t.name, search_query) DESC
```

### 2. Search Analytics
Track searches for improving results and discovering content gaps:
```sql
CREATE TABLE search_logs (
  id uuid PRIMARY KEY,
  query text,
  result_count integer,
  clicked_topic_id uuid,
  user_id uuid,
  created_at timestamptz
);
```

### 3. Personalized Ranking
Boost topics based on user's declared competencies:
```sql
-- If user knows React, boost React-related topics
CASE WHEN EXISTS (
  SELECT 1 FROM user_competencies uc
  WHERE uc.user_id = auth.uid()
  AND uc.competency_id IN (
    SELECT competency_id FROM topic_competencies WHERE topic_id = t.id
  )
) THEN rank * 1.2 ELSE rank END
```

### 4. Multi-Language Support
Add language parameter:
```sql
to_tsvector('spanish', ...)  -- For Spanish content
to_tsvector('french', ...)   -- For French content
```

---

**Document Status:** Design Complete - Ready for Implementation
**Last Updated:** November 20, 2025
**Estimated Implementation Time:** ~4 hours
- Database: 1 hour
- API: 30 minutes
- Frontend: 1.5 hours
- Testing: 1 hour
