# Topic Expansion Guide

**Status:** Ready for Topic Expansion
**Last Updated:** November 22, 2025
**Current Progress:** 23 topics, 1,617 competencies, 89 categories

---

## Overview

This guide is for expanding the topic database. **Competency expansion is complete** with 1,617 competencies across 89 categories. The focus now is creating outcome-oriented topics that map to these competencies.

### Key Concepts

1. **Competencies** = Underlying skills/technologies (e.g., React, Python, Spanish)
   - 1,617 competencies already defined
   - Users search by competency
   - Can have prerequisites and alternatives
   - Reference files available for lookup

2. **Topics** = Outcome-oriented learning paths (e.g., "Building web applications with Python")
   - What the user will be able to do/make
   - Maps to one or more competencies
   - Has 0-1 primary competencies plus supporting ones
   - Belongs to a specific category

3. **Categories** = Hierarchical organization (89 total)
   - Deep nesting via parent_slug
   - Help users browse and discover

---

## Current State

### Progress Summary
- **Total Competencies:** 1,617 (expansion complete)
- **Total Topics:** 23 (98.8% of competencies unused)
- **Total Categories:** 89

### Topic Distribution
- **Information & Technology:** 22 topics
  - Frontend Development: 9 topics
  - Full-stack Development: 3 topics
  - Backend Development: 3 topics
  - Software Testing: 3 topics
  - Programming: 3 topics
  - Game Development: 1 topic
- **All Other Categories:** 0 topics

### High-Priority Categories (Most Competencies, No Topics)
1. Cloud & DevOps (169 competencies)
2. Languages (169 competencies)
3. Data Science (95 competencies)
4. Music (58 competencies)
5. Databases (55 competencies)

---

## Available Scripts

### Topic-Specific Scripts

```bash
# Check for duplicate topic slugs/names
npm run check:topic-duplicates

# Generate topic reference files (TOPIC_REFERENCE.md, TOPIC_QUICK_LOOKUP.md)
npm run generate:topic-reference

# Find competencies not yet used in topics
npm run topic:unused-competencies

# Filter to specific category
npm run topic:unused-competencies -- --category=programming

# Show verbose stats (primary vs non-primary usage)
npm run topic:unused-competencies -- --verbose

# Generate coverage statistics and tree diagram
npm run topic:coverage
```

### Competency Reference Scripts

```bash
# Generate competency reference files (for lookup during topic creation)
npm run generate:competency-reference

# Check for competency synonym/name duplicates
npm run check:competency-synonyms
```

### Workflow Scripts

```bash
# Generate SQL seed file from JSON
npm run generate:seed

# Reset database with new seed data
supabase db reset
```

---

## Topic Naming Convention

### ✅ Good Topic Names (Action-oriented, outcome-focused)

- "Building web applications with Python"
- "Conversational Spanish"
- "Creating interactive UIs with React"
- "Automating repetitive tasks with Python"
- "Data analysis for decisionmaking"
- "Writing unit tests for Vue.js applications"
- "Deploying containerized applications with Docker"

### ❌ Bad Topic Names (Too generic, no clear outcome)

- "Python" (this is a competency, not a topic)
- "Learn React"
- "Spanish Language"
- "Web Development"
- "Programming Basics"

### Naming Guidelines

Always think: **"What will the user be able to do after completing this?"**

Examples:
- **Topic:** "Conversational Spanish"
  - **Outcome:** Navigate conversations with Spanish-speakers

- **Topic:** "Building REST APIs with Node.js"
  - **Outcome:** Create production-ready backend services

- **Topic:** "Data visualization for business reports"
  - **Outcome:** Create compelling visual reports for stakeholders

---

## Topic Data Structure

### File Location
Topics are organized in `data/seeds/topics/{domain}.json` files:

```
data/seeds/topics/
├── 001-programming.json
├── 004-backend-apis.json
├── 005-frontend-development.json
├── 013-languages.json
└── ... (add more as needed)
```

### Topic JSON Format

```json
{
  "topics": [
    {
      "name": "Building interactive UIs with React",
      "slug": "building-interactive-uis-with-react",
      "description": "Learn to create dynamic user interfaces using React components and hooks",
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
        }
      ]
    }
  ]
}
```

### Field Descriptions

- **name**: Action-oriented topic name (what user will learn to do)
- **slug**: Kebab-case URL-safe identifier (must be unique)
- **description**: 1-2 sentence description of learning outcome
- **category_slug**: Most specific category that fits (use `topic:coverage` to find categories)
- **competencies**: Array of competency associations
  - **competency_slug**: Must match existing competency (check COMPETENCY_QUICK_LOOKUP.md)
  - **is_primary**: true for main skill(s), false for supporting skills
  - Can have 0-1 primary competencies
  - Can have multiple non-primary (supporting) competencies

---

## Understanding Competency Mapping

### Core Principle: Direct Exposure

**Competencies listed in a topic represent what the learner will be directly exposed to during the learning path.**

Think of it as: "What technologies/skills will I actively use and learn while working on this topic?"

### Competencies vs Prerequisites

**Important:** Prerequisites are a **competency-to-competency relationship**, not a topic-to-competency relationship.

- **Topic Competencies**: Technologies you'll actively use while learning this topic
- **Competency Prerequisites**: Knowledge required before learning a competency (defined in the competency itself)

**Example:**
- Topic: "Type-safe React applications with TypeScript"
  - Competencies: `typescript` (primary), `react`, `html`, `css`
  - Note: `javascript` is NOT listed as a competency
  - Why? JavaScript is a prerequisite of TypeScript (defined at the competency level)
  - The learner writes TypeScript code, not JavaScript directly

### Mapping Guidelines

#### 1. Specific Technologies Over Concepts

Use specific tools/technologies rather than abstract concepts when both exist.

✅ **Correct:**
- Django topic includes `django-orm` (the specific ORM)

❌ **Incorrect:**
- Django topic includes `orm` (the abstract concept)

**Rationale:** When learning an ORM, you learn a specific implementation (Django ORM, Sequelize, etc.), not the abstract concept in isolation.

#### 2. Abstraction Boundaries

Only include underlying technologies if the abstraction **requires** direct interaction with them.

✅ **Include underlying tech when:**
- Vue.js topics include `html` and `css` - you write HTML-like templates and CSS styles
- Django topics include `html` and `css` - you create templates and stylesheets
- React topics include `html` and `css` - you write JSX (HTML-like) and styles

❌ **Don't include underlying tech when:**
- TypeScript topics should NOT include `javascript` - you write TypeScript, which compiles to JavaScript
- Ruby topics should NOT include `c` - Ruby is built on C, but you never write C code

**Rationale:** If the abstraction completely hides the underlying technology, don't include it. If you're actively writing in that technology (even in an abstracted form), include it.

#### 3. Framework Dependencies

Include frameworks/languages when you're actively coding in them, even if they're not the primary focus.

✅ **Correct:**
- "Testing Vue.js applications with Jest"
  - Competencies: `jest` (primary), `vuejs`, `javascript`
  - You're writing Jest tests for Vue components in JavaScript

✅ **Correct:**
- "Building web applications with Python and Django"
  - Competencies: `django` (primary), `python`, `django-orm`, `html`, `css`
  - You're writing Python/Django code, using the ORM, creating templates

❌ **Incorrect:**
- "Advanced TypeScript patterns and generics"
  - Competencies: `typescript` (primary), ~~`javascript`~~
  - You're only writing TypeScript code (JavaScript is a prerequisite)

### Common Patterns

#### Web Frontend Frameworks

Topics about Vue, React, Angular, etc. should include:
- The framework itself (primary or supporting)
- `javascript` or `typescript` (depending on which you're writing)
- `html` (template syntax)
- `css` (styling)

```json
{
  "name": "Building reactive web applications with Vue.js",
  "competencies": [
    {"competency_slug": "vuejs", "is_primary": true},
    {"competency_slug": "javascript", "is_primary": false},
    {"competency_slug": "html", "is_primary": false},
    {"competency_slug": "css", "is_primary": false}
  ]
}
```

#### TypeScript-Only Topics

Topics where you write only TypeScript (not JavaScript) should NOT include JavaScript:

```json
{
  "name": "Type-safe JavaScript development with TypeScript",
  "competencies": [
    {"competency_slug": "typescript", "is_primary": true}
    // No javascript - it's a prerequisite of TypeScript
  ]
}
```

#### Full-stack Web Frameworks

Backend frameworks that serve HTML should include web technologies:

```json
{
  "name": "Building web applications with Python and Django",
  "competencies": [
    {"competency_slug": "django", "is_primary": true},
    {"competency_slug": "python", "is_primary": false},
    {"competency_slug": "django-orm", "is_primary": false},
    {"competency_slug": "html", "is_primary": false},
    {"competency_slug": "css", "is_primary": false}
  ]
}
```

#### Testing Topics

Testing frameworks should include the technology being tested:

```json
{
  "name": "Testing Vue.js applications with Jest",
  "competencies": [
    {"competency_slug": "jest", "is_primary": true},
    {"competency_slug": "vuejs", "is_primary": false},
    {"competency_slug": "javascript", "is_primary": false}
  ]
}
```

### Decision Framework

When deciding whether to include a competency, ask:

1. **Will the learner write code in this technology?** → Include it
2. **Is this a prerequisite handled at the competency level?** → Don't include it
3. **Does the primary technology completely hide this?** → Don't include it
4. **Is there a specific tool/technology for this concept?** → Use the specific one

---

## Topic Expansion Workflow

### 1. Choose Target Category

```bash
# See which categories need topics
npm run topic:coverage

# Find unused competencies in a category
npm run topic:unused-competencies -- --category=<category-slug>
```

### 2. Review Available Competencies

Check `data/seeds/COMPETENCY_QUICK_LOOKUP.md` for:
- All competencies in target category
- Competency slugs (for accurate references)
- Prerequisites and alternatives (for context)

### 3. Create Topics

For each competency, create 2-8 outcome-oriented topics:

**Example: Python competency might generate:**
- "Building web applications with Python"
- "Automating repetitive tasks with Python"
- "Data analysis with Python"
- "Writing unit tests in Python"
- "Building REST APIs with Flask"
- "Scraping and parsing web data with Python"

### 4. Add to Appropriate Domain File

Add topics to `data/seeds/topics/{domain}.json`:
- **programming.json** - Core programming languages and concepts
- **web-development.json** - Web frameworks, tools, frontend/backend
- **data-science.json** - Data analysis, ML, visualization
- **languages.json** - Natural languages
- Create new domain files as needed

### 5. Validate and Generate

```bash
# Check for duplicates
npm run check:topic-duplicates

# Generate reference files
npm run generate:topic-reference

# Generate SQL and reset database
npm run generate:seed
supabase db reset

# Verify in app
npm run dev  # Visit http://localhost:3001
```

---

## Quality Guidelines

### Before Committing Changes

- [ ] All topic names are action-oriented and outcome-focused
- [ ] Each topic clearly maps to competencies using correct slugs
- [ ] No duplicate slugs across topics
- [ ] All slugs follow kebab-case convention
- [ ] Competency references are valid (check COMPETENCY_QUICK_LOOKUP.md)
- [ ] Categories are correctly assigned (use most specific category)
- [ ] Descriptions clearly explain the learning outcome

### Topic Quality Checklist

1. **Clear Outcome**: Can you explain what the user will be able to do?
2. **Appropriate Scope**: Not too broad ("Learn Programming") or too narrow ("Using the map function")
3. **Competency Mapping**: Primary competency is the main skill being learned
4. **Category Assignment**: Use the most specific category that fits
5. **Unique Value**: Topic isn't a duplicate of existing topics

---

## Expansion Strategy

### Recommended Approach

1. **Start with high-value categories** (most competencies, likely user demand)
   - Programming (45 unused competencies)
   - Cloud & DevOps (169 competencies)
   - Data Science (95 competencies)
   - Languages (169 competencies)

2. **Create 5-8 topics per competency** as a baseline
   - Beginner-friendly topics
   - Intermediate/advanced topics
   - Domain-specific applications
   - Project-based outcomes

3. **Work in batches** (10-20 competencies per session)
   - Prevents context overload
   - Allows for testing between batches
   - Easier to review and validate

4. **Track progress regularly**
   ```bash
   npm run topic:unused-competencies -- --category=<category>
   npm run topic:coverage
   ```

### Expected Scale

With 1,617 competencies and 5-8 topics each:
- **Conservative:** ~8,000 topics
- **Comprehensive:** ~12,000 topics

Current: 23 topics (0.3% of conservative target)

---

## Common Patterns

### Primary vs Supporting Competencies

**Primary Competency** (is_primary: true):
- The main skill being learned
- What the topic is "about"
- Usually 0-1 per topic

**Supporting Competency** (is_primary: false):
- Technologies you'll actively use alongside the primary skill
- Skills you'll be directly exposed to during the learning path
- Not the main focus, but still something you'll practice
- Can have many per topic

**Note:** Don't confuse supporting competencies with prerequisites. Prerequisites are defined at the competency level (e.g., JavaScript is a prerequisite of TypeScript), not in the topic's competency list.

**Examples:**

```json
{
  "name": "Building REST APIs with Express.js",
  "competencies": [
    {"competency_slug": "expressjs", "is_primary": true},
    {"competency_slug": "nodejs", "is_primary": false},
    {"competency_slug": "javascript", "is_primary": false},
    {"competency_slug": "rest-api", "is_primary": false}
  ]
}
```

```json
{
  "name": "Testing React applications with Jest",
  "competencies": [
    {"competency_slug": "jest", "is_primary": true},
    {"competency_slug": "react", "is_primary": false},
    {"competency_slug": "javascript", "is_primary": false}
  ]
}
```

### Topics Without Primary Competencies

Some topics may not have a primary competency if they're about a general activity:

```json
{
  "name": "Redstone automation in Minecraft",
  "competencies": []  // No specific skill competency, just something many people want to learn
}
```

---

## File Organization

### Domain File Guidelines

When adding topics, use these domain files:

- **001-programming.json** - Core programming languages and concepts
- **002-cloud-devops.json** - Cloud platforms, containers, CI/CD
- **003-databases.json** - Database systems and data storage
- **004-backend-apis.json** - Backend frameworks, APIs, servers
- **005-frontend-development.json** - Frontend frameworks, UI libraries
- **006-ai-ml.json** - Machine learning, AI, deep learning
- **007-security.json** - Cybersecurity, infosec
- **008-blockchain-web3.json** - Blockchain, crypto, Web3
- **009-design.json** - UI/UX, graphic design
- **010-data-science.json** - Data analysis, visualization, statistics
- **011-mobile-development.json** - iOS, Android, cross-platform
- **012-game-development.json** - Game engines, game design
- **013-languages.json** - Natural and constructed languages
- **014-visual-arts.json** - Painting, drawing, digital art
- **015-writing.json** - Creative writing, technical writing
- **016-fiber-arts-crafts.json** - Textile arts, crafts
- **017-home-lifestyle.json** - Cooking, home improvement
- **018-theater.json** - Acting, stagecraft, drama
- **019-recreation-hobbies.json** - Games, sports, hobbies
- **020-music-performance.json** - Instruments, performance, theory
- **021-dance.json** - Dance styles and choreography
- **022-business.json** - Business, management, entrepreneurship
- **023-mathematics.json** - Math topics at all levels
- **024-personal-development.json** - Productivity, communication
- **025-finance.json** - Finance, investing, accounting
- **026-health-fitness.json** - Physical fitness, nutrition
- **027-science.json** - Physical, life, earth sciences

Create new domain files as needed, following the naming pattern.

---

## Reference Files

### Generated Files (Do Not Edit Directly)

- `data/seeds/COMPETENCY_REFERENCE.md` - Detailed competency info
- `data/seeds/COMPETENCY_QUICK_LOOKUP.md` - Alphabetical competency list
- `data/seeds/TOPIC_REFERENCE.md` - Detailed topic info
- `data/seeds/TOPIC_QUICK_LOOKUP.md` - Alphabetical topic list
- `data/seeds/TOPIC_COVERAGE_TREE.md` - Category tree with counts

### Source Files (Edit These)

- `data/seeds/categories.json` - Category hierarchy (stable, rarely changes)
- `data/seeds/competencies/*.json` - Competency definitions (complete)
- `data/seeds/topics/*.json` - **Topic definitions (actively expanding)**

---

## Tips for Effective Topic Expansion

1. **Use reference files**: Always check COMPETENCY_QUICK_LOOKUP.md before creating topics
2. **Run scripts frequently**: Use `topic:unused-competencies` to track progress
3. **Batch similar work**: Expand all topics for related competencies together
4. **Test as you go**: Reset database and verify topics appear correctly in app
5. **Think user outcomes**: Focus on what users want to achieve, not just learn
6. **Map competencies correctly**: Include only technologies the learner will directly use (see "Understanding Competency Mapping" section)
7. **Check prerequisites**: Review competency prerequisites to understand learning paths, but don't add prerequisites as topic competencies
8. **Leverage alternatives**: Create similar topics for alternative technologies (React vs Vue vs Angular)
9. **Use specific over generic**: Prefer specific technologies (django-orm) over concepts (orm)
10. **CRITICAL RULE**: Do not add "for travelers" or similar goal framing to topic titles. We will track goals separately—topics should indicate what users will learn, not _why_.

---

## Next Steps

1. **Choose a category** with many competencies but no topics
2. **Review competencies** in that category using `topic:unused-competencies`
3. **Create 5-10 topics** for the first few competencies
4. **Validate** with `check:topic-duplicates` and `generate:topic-reference`
5. **Test** by generating seed and resetting database
6. **Iterate** and expand to more competencies

**Goal:** Create comprehensive, outcome-oriented topics for all 1,617 competencies.

---

**Document Status:** Ready for topic expansion
**For Questions:** Review this guide, check reference files, or examine existing topics in `data/seeds/topics/` for patterns
