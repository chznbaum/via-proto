# Seed File Organization Strategy

**Date:** November 20, 2025
**Status:** Proposed
**Related:** TOPIC_EXPANSION_PLAN.md, DATA_MODEL_MIGRATION_ANALYSIS.md

---

## Problem

The current `data/topics_seed_new_structure.json` file is already over 1000 lines and will grow to 5000+ lines as we expand to 1000+ topics. This makes it:
- Difficult for humans to navigate and edit
- Prone to merge conflicts in version control
- Hard for LLMs to parse and modify without errors
- Slow to load and process

---

## Proposed Structure

Split the seed data into multiple focused files organized by domain and data type.

### Directory Structure

```
data/
├── seeds/
│   ├── categories.json          # All categories (hierarchical)
│   ├── competencies/             # Competencies by domain
│   │   ├── programming.json
│   │   ├── web-development.json
│   │   ├── data-science.json
│   │   ├── design.json
│   │   ├── business.json
│   │   ├── languages.json
│   │   ├── mathematics.json
│   │   ├── science.json
│   │   ├── personal-development.json
│   │   ├── creative-arts.json
│   │   ├── health-fitness.json
│   │   └── finance.json
│   ├── topics/                   # Topics by domain
│   │   ├── programming.json
│   │   ├── web-development.json
│   │   ├── data-science.json
│   │   ├── design.json
│   │   ├── business.json
│   │   ├── languages.json
│   │   ├── mathematics.json
│   │   ├── science.json
│   │   ├── personal-development.json
│   │   ├── creative-arts.json
│   │   ├── health-fitness.json
│   │   └── finance.json
│   └── unsplash_images.json     # Unsplash image references
├── scripts/
│   └── generate-seed-sql.ts     # Script to combine JSON → SQL
└── topics_seed_new_structure.json  # DEPRECATED - Keep for reference
```

---

## File Format Specifications

### 1. `categories.json`

**Format:** Flat array with parent slugs (easier to parse than nested)

```json
{
  "categories": [
    {
      "name": "Information & Technology",
      "slug": "information-technology",
      "description": "Technology, software, and digital skills",
      "icon": "ComputerDesktopIcon",
      "display_order": 1,
      "parent_slug": null
    },
    {
      "name": "Programming",
      "slug": "programming",
      "description": "Software development and programming languages",
      "icon": "CodeBracketIcon",
      "display_order": 1,
      "parent_slug": "information-technology"
    }
  ]
}
```

**Size:** ~50-100 lines (all categories)

---

### 2. `competencies/{domain}.json`

**Format:** Array of competencies with embedded prerequisites, alternatives, and synonyms

```json
{
  "competencies": [
    {
      "name": "React",
      "slug": "react",
      "description": "JavaScript library for building user interfaces",
      "category_slug": "frontend-development",
      "synonyms": ["React.js", "ReactJS", "React Framework"],
      "prerequisites": [
        {
          "prerequisite_slug": "javascript",
          "prerequisite_level": "required",
          "notes": "JavaScript fundamentals required before learning React"
        },
        {
          "prerequisite_slug": "html",
          "prerequisite_level": "recommended",
          "notes": "Understanding HTML helps with JSX syntax"
        }
      ],
      "alternatives": [
        {
          "alternative_slug": "vuejs",
          "relationship_type": "similar",
          "notes": "Vue.js is a similar component-based framework"
        },
        {
          "alternative_slug": "angular",
          "relationship_type": "similar",
          "notes": "Angular is another popular frontend framework"
        }
      ]
    }
  ]
}
```

**Size Per File:** 200-500 lines (10-30 competencies per domain)

**Domains:**
- `programming.json` - Core languages (JavaScript, Python, Java, C++, etc.)
- `web-development.json` - Web frameworks and tools (React, Vue, Node.js, Django, etc.)
- `data-science.json` - Data tools (Pandas, NumPy, TensorFlow, etc.)
- And so on...

---

### 3. `topics/{domain}.json`

**Format:** Array of topics with competency associations

```json
{
  "topics": [
    {
      "name": "Building interactive UIs with React",
      "slug": "building-interactive-uis-with-react",
      "description": "Learn to create dynamic, interactive user interfaces using React's component-based architecture",
      "category_slug": "frontend-development",
      "competencies": [
        {
          "competency_slug": "react",
          "is_primary": true
        },
        {
          "competency_slug": "javascript",
          "is_primary": false
        },
        {
          "competency_slug": "html",
          "is_primary": false
        },
        {
          "competency_slug": "css",
          "is_primary": false
        }
      ]
    }
  ]
}
```

**Size Per File:** 500-1000 lines (30-100 topics per domain)

---

### 4. `unsplash_images.json`

**Format:** Simple array of Unsplash image records

```json
{
  "images": [
    {
      "photo_id": "OQMZwNd3ThU",
      "url": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85...",
      "photographer": "Scott Graham",
      "photographer_username": "amstram",
      "photographer_url": "https://unsplash.com/@amstram?utm_source=ViaProto...",
      "download_location": "https://api.unsplash.com/photos/OQMZwNd3ThU/download...",
      "alt_description": "man writing on paper",
      "usage_note": "Used on /tos page for legal documentation illustration"
    }
  ]
}
```

**Size:** 50-100 lines (static content)

---

## Generation Script

### `scripts/generate-seed-sql.ts`

**Purpose:** Combine all JSON files into a single SQL seed file

**Process:**
1. Read `categories.json` → Generate category INSERT statements
2. Read all `competencies/*.json` → Generate competencies, synonyms, prerequisites, alternatives
3. Read all `topics/*.json` → Generate topics and topic_competencies
4. Read `unsplash_images.json` → Generate unsplash_images INSERT statements
5. Write to `supabase/seed.sql`

**Usage:**
```bash
npm run generate:seed    # Combines JSON → SQL
supabase db reset        # Applies migrations + seed.sql
```

**Add to package.json:**
```json
{
  "scripts": {
    "generate:seed": "tsx scripts/generate-seed-sql.ts"
  }
}
```

---

## Benefits

### 1. **Modularity**
- Edit one domain without touching others
- Reduce merge conflicts in team environments
- Clear separation of concerns

### 2. **Scalability**
- Each file stays under 1000 lines
- Easy to add new domains
- Parallel editing by multiple people

### 3. **Maintainability**
- Easier to find specific competencies or topics
- Clear file naming convention
- Better for code reviews

### 4. **LLM-Friendly**
- Smaller files fit in context windows
- Claude can edit specific domains without full codebase
- Less prone to JSON formatting errors

### 5. **Performance**
- Generation script can run in parallel for each domain
- Faster to parse and validate
- Easy to cache unchanged domains

---

## Migration Steps

### Phase 1: Create Directory Structure
```bash
mkdir -p data/seeds/competencies
mkdir -p data/seeds/topics
mkdir -p data/scripts
```

### Phase 2: Split Current JSON
1. Extract categories → `data/seeds/categories.json`
2. Extract unsplash images → `data/seeds/unsplash_images.json`
3. Extract competencies by domain → `data/seeds/competencies/{domain}.json`
4. Extract topics by domain → `data/seeds/topics/{domain}.json`

### Phase 3: Create Generation Script
1. Write `scripts/generate-seed-sql.ts`
2. Implement JSON → SQL conversion logic
3. Test generation: `npm run generate:seed`
4. Verify output matches current `supabase/seed.sql`

### Phase 4: Validation
1. Run `supabase db reset`
2. Verify all data loads correctly
3. Test search functionality
4. Confirm category hierarchy

### Phase 5: Documentation
1. Update README with new workflow
2. Add comments to generation script
3. Document file formats
4. Create examples for contributors

---

## Domain Assignment Guidelines

When deciding which file to add a competency/topic to, use these rules:

### Programming Domain (`programming.json`)
- Core programming languages (JavaScript, Python, Java, C++, Go, Rust, etc.)
- General programming concepts (OOP, functional programming, design patterns)

### Web Development Domain (`web-development.json`)
- Frontend frameworks (React, Vue, Angular, Svelte)
- Backend frameworks (Express, Django, Flask, Rails)
- Web-specific tools (Next.js, Nuxt.js, webpack, Vite)

### Data Science Domain (`data-science.json`)
- Data analysis libraries (Pandas, NumPy, R)
- ML frameworks (TensorFlow, PyTorch, scikit-learn)
- Visualization tools (Matplotlib, Tableau, Power BI)

### Rule of Thumb:
- If a competency fits multiple domains, assign to the **most specific** one
- If still ambiguous, assign to the category where it's **primarily used**
- Document edge cases in the script comments

---

## Future Enhancements

### Validation Script
```bash
npm run validate:seeds   # Check JSON syntax, slug uniqueness, foreign keys
```

### Seed Diff Tool
```bash
npm run seed:diff        # Show changes since last generation
```

### Seed Stats
```bash
npm run seed:stats       # Show competency/topic counts per domain
```

---

## Implementation Priority

### Must-Have (Before Continuing Expansion):
1. ✅ Create directory structure
2. ✅ Split current JSON into separate files
3. ✅ Create generation script
4. ✅ Test and validate
5. ✅ Update documentation

### Nice-to-Have (Post-Migration):
- Validation script
- Seed diff tool
- Seed stats

---

**Document Status:** Proposed - Ready for implementation
**Last Updated:** November 20, 2025
**Estimated Time:** 2-3 hours
