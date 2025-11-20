# Data Model Migration Analysis

**Date:** November 20, 2025
**Status:** Analysis Complete - Ready for Implementation
**Related:** TOPIC_EXPANSION_PLAN.md

---

## Overview

This document identifies all application code changes needed to support the new competency-based data model. The data model changes have been completed via migrations, but the application layer has NOT been updated yet.

---

## Key Data Model Changes (Already Migrated)

### 1. Competency-Based Architecture
**Before:** Topics were searchable entities with synonyms
**After:** Competencies are searchable entities with synonyms; Topics are outcome-oriented learning paths linked to competencies

**Schema Changes:**
- `topics` table: Removed `category` (text) and `tags` (array), added `category_id` (uuid foreign key)
- Created `competencies` table with `category_id`
- Created `competency_synonyms` table (moved from `topic_synonyms`)
- Created `topic_competencies` junction table (links topics to competencies)
- Created `competency_prerequisites` table with `prerequisite_level` enum
- Created `competency_alternatives` table
- Created `user_competencies` table for proficiency tracking

### 2. Prerequisites Architecture
**Before:** Boolean `is_required` field
**After:** Three-level `prerequisite_level` enum ('required', 'recommended', 'optional')

**Tables Affected:**
- `competency_prerequisites.prerequisite_level` (replaces `is_required`)
- `sections.prerequisite_level` (already using the new enum)

### 3. Category Hierarchy
**Before:** Flat text-based categories
**After:** Hierarchical categories with `parent_id` and proper foreign key relationships

---

## Application Code Changes Required

### ⚠️ CRITICAL: Search Functionality (Breaking Change)

#### Current State (WRONG):
- `/api/topics/route.ts` searches `topics` table directly
- `search_topics()` RPC function searches topic names and topic_synonyms
- Frontend typeahead searches for topics

#### Required State (CORRECT):
- Users should search for **COMPETENCIES**, not topics
- Search should query `competencies` and `competency_synonyms` tables
- After finding a competency, return **TOPICS** associated with that competency
- Frontend should display topics grouped by competency

#### Files to Update:

1. **Create New RPC Function:** `supabase/migrations/YYYYMMDD_create_search_competencies_function.sql`
   ```sql
   CREATE OR REPLACE FUNCTION public.search_competencies(
       search_query text,
       result_limit integer DEFAULT 10,
       filter_category_id uuid DEFAULT NULL
   )
   RETURNS TABLE (
       id uuid,
       name text,
       slug text,
       description text,
       category_id uuid,
       is_active boolean,
       match_type text,
       topics_count integer
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
       RETURN QUERY
       WITH competency_matches AS (
           -- Search in competency names
           SELECT
               c.id,
               c.name,
               c.slug,
               c.description,
               c.category_id,
               c.is_active,
               'name'::text AS match_type,
               similarity(c.name, search_query) AS rank
           FROM public.competencies c
           WHERE
               c.is_active = true
               AND c.name ILIKE '%' || search_query || '%'
               AND (filter_category_id IS NULL OR c.category_id = filter_category_id)

           UNION ALL

           -- Search in synonyms
           SELECT
               c.id,
               c.name,
               c.slug,
               c.description,
               c.category_id,
               c.is_active,
               'synonym'::text AS match_type,
               similarity(cs.synonym, search_query) AS rank
           FROM public.competencies c
           INNER JOIN public.competency_synonyms cs ON c.id = cs.competency_id
           WHERE
               c.is_active = true
               AND cs.synonym ILIKE '%' || search_query || '%'
               AND (filter_category_id IS NULL OR c.category_id = filter_category_id)
       )
       SELECT DISTINCT ON (cm.id)
           cm.id,
           cm.name,
           cm.slug,
           cm.description,
           cm.category_id,
           cm.is_active,
           cm.match_type,
           (SELECT COUNT(*) FROM public.topic_competencies tc
            INNER JOIN public.topics t ON tc.topic_id = t.id
            WHERE tc.competency_id = cm.id AND t.is_active = true) as topics_count
       FROM competency_matches cm
       ORDER BY cm.id, cm.rank DESC, cm.match_type
       LIMIT result_limit;
   END;
   $$;
   ```

2. **Create New API Endpoint:** `/api/competencies/route.ts`
   ```typescript
   // GET /api/competencies?q=react&limit=10&category_id=uuid
   // Returns competencies with associated topics
   export async function GET(req: NextRequest) {
     // Search competencies using new RPC function
     // For each competency, optionally fetch associated topics
   }
   ```

3. **Update Topics API:** `/api/topics/route.ts`
   - Change to `/api/competencies/[competency_id]/topics/route.ts`
   - OR keep `/api/topics` but make it list topics BY competency
   - Remove direct topic search functionality
   - Update to use `category_id` instead of `category` text field

4. **Frontend TypeaheadSearch Component:**
   - Update to call `/api/competencies` instead of `/api/topics`
   - Display competency names in dropdown (e.g., "React - JavaScript library for building UIs")
   - Show topic count under each competency (e.g., "5 topics available")
   - After selecting competency, show topics selection modal or auto-select primary topic

---

### 2. Topic Selection Flow

#### Current Flow (WRONG):
1. User searches "React"
2. System finds topic named "React"
3. User generates path for topic "React"

#### New Flow (CORRECT):
1. User searches "React"
2. System finds **competency** "React" (with synonyms: React.js, ReactJS, etc.)
3. System shows topics for React competency:
   - "Building interactive UIs with React"
   - "Creating SPAs with React and React Router"
   - "State management with React and Redux"
   - etc.
4. User selects a topic
5. User generates path for selected topic

#### Implementation:
- Add competency selection step before topic selection
- Create `/api/competencies/[id]/topics` endpoint to fetch topics for a competency
- Update path generation to work with the selected topic (should already work since it uses `topic_id`)

---

### 3. Category References

#### Files Using Old `category` Text Field:
- `/api/topics/route.ts` line 48: `.eq('category', category)` → Should use category_id
- `search_topics()` RPC function uses `t.category` → Needs migration to use category_id

#### Migration Strategy:
1. Update all API queries to use `category_id` joins instead of `category` text
2. Frontend should pass category UUIDs, not category names
3. Update RPC functions to accept `category_id` parameter

---

### 4. Path Generation Prompt Enhancement

#### Current State (GOOD):
- `/libs/openrouter.ts` already uses three-level prerequisite system (lines 41-44)
- Schema validation already uses `prerequisite_level` enum (path-schema.ts line 23)

#### Potential Enhancement:
Consider passing competency metadata to LLM for better path generation:
- Competency prerequisites (required/recommended/optional)
- User's proficiency level in prerequisites (if `user_competencies` table is populated)
- Alternative competencies for suggestions

**Example Enhancement:**
```typescript
// In /app/api/paths/generate/route.ts (after line 111)

// Fetch competency information for the topic
const { data: topicCompetencies } = await supabase
  .from('topic_competencies')
  .select(`
    is_primary,
    competency:competencies(
      name,
      slug,
      description,
      prerequisites:competency_prerequisites(
        prerequisite_level,
        prerequisite:competencies(name, slug)
      )
    )
  `)
  .eq('topic_id', topic.id);

// Pass to LLM prompt for prerequisite checking
const aiResponse = await generateLearningPath({
  topic: topic.name,
  skillLevel: validatedInput.skill_level,
  goals: validatedInput.goals,
  model: selectedModel,
  competencies: topicCompetencies, // NEW
});
```

---

### 5. Frontend Display Updates

#### Topic Browse Page
**Current:** Likely shows topics in flat list
**Update:** Should show hierarchical category navigation OR competency-based browsing

**Options:**
- **Option A:** Browse by categories → Filter by competencies → Select topic
- **Option B:** Browse by competencies (with category filters) → Select topic

#### Path Detail Page
**Current:** Shows topic name
**Update:** Should show:
- Primary competency (e.g., "React")
- Secondary competencies (e.g., "JavaScript", "HTML", "CSS")
- Topic title (e.g., "Building interactive UIs with React")

---

## Migration Checklist

### Phase 1: Database Functions & API Updates (Required Before Testing)
- [ ] Create `search_competencies()` RPC function
- [ ] Create `/api/competencies` endpoint
- [ ] Create `/api/competencies/[id]/topics` endpoint
- [ ] Update `/api/topics` to use `category_id` instead of `category`
- [ ] Deprecate old `search_topics()` RPC function (can keep for backward compatibility during migration)

### Phase 2: Frontend Updates (Required Before Testing)
- [ ] Update TypeaheadSearch component to search competencies
- [ ] Add competency → topics selection flow
- [ ] Update topic display to show competencies
- [ ] Update category filtering to use UUIDs

### Phase 3: Optional Enhancements (Post-Launch)
- [ ] Add user proficiency tracking UI
- [ ] Enhance path generation with prerequisite checking
- [ ] Add competency prerequisites display
- [ ] Add alternative competencies suggestions

---

## Testing Plan

### 1. Search Functionality
- [ ] Search for "React" → Returns React competency with topic count
- [ ] Search for "ReactJS" (synonym) → Returns React competency
- [ ] Select React competency → Shows available React topics
- [ ] Select a topic → Generate path successfully

### 2. Path Generation
- [ ] Generate path for a topic → Sections use prerequisite_level enum
- [ ] Verify path contains correct competency associations
- [ ] Check that all three prerequisite levels work (required/recommended/optional)

### 3. Category Filtering
- [ ] Filter by category → Shows competencies in that category
- [ ] Hierarchical category navigation works
- [ ] Category icons display correctly

---

## Risk Assessment

### High Risk (Must Fix):
- ❌ **Search functionality completely broken** - searches wrong table
- ❌ **Category filtering broken** - uses wrong field type

### Medium Risk (May cause issues):
- ⚠️ **Topic selection UX confusing** - users don't understand competency vs topic
- ⚠️ **Path generation missing prerequisite context** - LLM doesn't know user's existing skills

### Low Risk (Nice to have):
- ✅ Path generation prompt already handles new prerequisite levels
- ✅ Schema validation already correct
- ✅ Sections table already using prerequisite_level

---

## Estimated Implementation Time

### Must-Have (Before Testing):
- Database functions: 30 minutes
- API endpoints: 1 hour
- Frontend search: 1 hour
- Frontend topic selection: 1 hour
- Testing: 1 hour
**Total: ~4.5 hours**

### Optional Enhancements:
- Prerequisite checking in path generation: 2 hours
- User proficiency tracking: 4 hours
- Alternative suggestions: 2 hours
**Total: ~8 hours**

---

## Next Steps

1. **Immediate:** Create new database functions and API endpoints
2. **Frontend:** Update search and topic selection flow
3. **Test:** Verify search → topic selection → path generation works end-to-end
4. **Polish:** Add prerequisite checking and user proficiency features
5. **Resume:** Continue topic expansion in TOPIC_EXPANSION_PLAN.md

---

**Document Status:** Complete - Ready for implementation
**Last Updated:** November 20, 2025
