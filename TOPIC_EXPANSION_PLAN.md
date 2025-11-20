# Topic Expansion Plan - Phase 2
**Goal:** Expand from ~270 generic topics to 1000+ goal-oriented topics

**Status:** Planning Complete - Ready to Execute
**Created:** November 20, 2025
**Estimated Sessions:** 8-12 sessions
**Progress:** 3/1000+ topics complete (0.3%)

---

## Q&A Context (Session 1)

### Category Structure Decision
**Q:** Should we add more top-level categories or nest them?
**A:** Review the original 12 categories and decide which should be top-level vs nested. Don't assume they need to stay as they were. Look for logical groupings.

### Competency Category Assignment
**Q:** How to assign competencies that could fit multiple categories (e.g., Python)?
**A:** Assign to the most appropriate single category based on primary use:
- **Python** → Programming (it's fundamentally a programming language)
- **Flask** → Backend Development (it's a backend framework)
- **Pandas** → Data Science (it's a data analysis library)

Even if a competency is used across domains, there's usually one category that makes the most sense.

### Proficiency Level Architecture
**Q:** Should we specify proficiency_level in topic_competencies?
**A:** **NO.** Instead, allow users to declare their current proficiency for competencies. This enables:
- Better prerequisite checking ("Do you know JavaScript?" before generating a React path)
- Personalized learning paths
- Progress tracking across topics

**Schema Change Needed:** Add user proficiency tracking table (see Schema Changes section below).

### Prerequisites: Required vs Recommended vs Optional
**Q:** Should all prerequisites be marked as "required"?
**A:** **NO.** We need three levels:

1. **Required:** Cannot learn without this (e.g., JavaScript for React, Algebra for Calculus)
2. **Recommended:** Strongly beneficial but not blocking (e.g., Geometry before Algebra)
3. **Optional:** Useful for specific interests/passions (e.g., Accessibility basics for web development)

**Schema Change Needed:** Change `competency_prerequisites.is_required` boolean to `prerequisite_level` enum.

---

## Schema Changes Required

### 1. Change `is_required` to `prerequisite_level` Enum

**Current Schema:**
```sql
-- competency_prerequisites table
is_required BOOLEAN NOT NULL DEFAULT true
```

**New Schema:**
```sql
-- competency_prerequisites table
prerequisite_level TEXT NOT NULL CHECK (prerequisite_level IN ('required', 'recommended', 'optional'))
```

**Migration Steps:**
1. Add new column `prerequisite_level TEXT`
2. Migrate data: `is_required = true` → `'required'`, `is_required = false` → `'optional'`
3. Drop `is_required` column
4. Add constraint

**Impact:**
- Seed generation script needs update
- Frontend prerequisite checking needs update
- LLM prompt can now include prerequisite levels when generating paths

### 2. Add User Competency Proficiency Tracking

**Purpose:** Allow users to declare their proficiency in competencies for better prerequisite checking and personalized paths.

**New Table:**
```sql
CREATE TABLE public.user_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('none', 'beginner', 'intermediate', 'advanced', 'expert')),
  self_assessed BOOLEAN NOT NULL DEFAULT true,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, competency_id)
);

-- Indexes
CREATE INDEX idx_user_competencies_user_id ON public.user_competencies(user_id);
CREATE INDEX idx_user_competencies_competency_id ON public.user_competencies(competency_id);

-- RLS Policies
ALTER TABLE public.user_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own competency assessments"
  ON public.user_competencies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competency assessments"
  ON public.user_competencies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competency assessments"
  ON public.user_competencies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competency assessments"
  ON public.user_competencies FOR DELETE
  USING (auth.uid() = user_id);
```

**Use Cases:**
- During path generation, ask user: "Do you know JavaScript?" (prerequisite for React)
- Show prerequisite warnings: "This path requires intermediate Python. Mark your level?"
- Track learning progress: "You've completed 3 Python paths. Update proficiency to intermediate?"
- Smart recommendations: "Based on your JavaScript expertise, try these advanced topics..."

**Implementation Priority:** Can be added post-expansion, but document now for future reference.

---

## Category Hierarchy - Final Structure

### Original 12 Categories from topics_seed.json
1. Programming ✅ (nested under Information & Technology)
2. Design ✅ (top-level as "Design & Creativity")
3. Data Science ✅ (nested under Information & Technology > Data & Analytics)
4. Business ✅ (top-level as "Business & Management")
5. Language Learning → **Rename to "Languages"** ✅
6. Mathematics → **Add as top-level**
7. Science → **Add as top-level**
8. Personal Development → **Add as top-level**
9. Creative Arts → **Nest under Design & Creativity**
10. Health & Fitness → **Add as top-level**
11. Finance → **Nest under Business & Management**

### Proposed Final Hierarchy

```
1. Information & Technology (existing)
   ├─ Programming (existing)
   │  ├─ Web Development (existing)
   │  │  ├─ Frontend Development (existing)
   │  │  ├─ Full-stack Development (add)
   │  │  └─ Backend Development (existing)
   │  ├─ Mobile Development (existing)
   │  ├─ Game Development (add)
   │  ├─ Software Testing (add)
   │  └─ Systems Programming (add)
   ├─ Data & Analytics (existing)
   │  ├─ Data Science (existing)
   │  ├─ Data Engineering (existing)
   │  └─ Databases (add)
   ├─ Cloud & DevOps (add)
   └─ Information Security (add)
      └─ Cybersecurity (add)

2. Design & Creativity (existing)
   ├─ UI/UX Design (add)
   ├─ Graphic Design (add)
   ├─ Motion & 3D (add)
   ├─ Creative Arts (add - from original category)
   │  ├─ Photography & Video (add)
   │  ├─ Music (add)
   │  ├─ Writing (add)
   │  ├─ Theater (add)
   │  └─ Visual Arts (add)
   └─ Architecture (add - optional)

3. Business & Management (existing)
   ├─ Product & Project Management (add)
   ├─ Marketing & Sales (add)
   ├─ Leadership & Communication (add)
   ├─ Finance & Accounting (add - from original Finance category)
   │  ├─ Personal Finance (add)
   │  ├─ Investing & Trading (add)
   │  └─ Corporate Finance (add)
   └─ Operations & Strategy (add)

4. Linguistics (add)
   ├─ Languages (existing, rename from "Language Learning")
   └─ Speech Development & Pathology (add)

5. Mathematics (add as top-level)
   ├─ Foundational Math (add)
   │  ├─ Arithmetic (add)
   │  ├─ Algebra (add)
   │  ├─ Geometry (add)
   │  └─ Trigonometry (add)
   ├─ Advanced Math (add)
   │  ├─ Calculus (add)
   │  ├─ Linear Algebra (add)
   │  └─ Differential Equations (add)
   └─ Applied Math (add)
      ├─ Statistics & Probability (add)
      ├─ Discrete Mathematics (add)
      └─ Number Theory (add)

6. Science (add as top-level)
   ├─ Physical Sciences (add)
   │  ├─ Physics (add)
   │  ├─ Chemistry (add)
   │  └─ Astronomy (add)
   ├─ Life Sciences (add)
   │  ├─ Biology (add)
   │  ├─ Genetics (add)
   │  └─ Neuroscience (add)
   └─ Environmental Science (add)

7. Personal Development (add as top-level)
   ├─ Productivity & Time Management (add)
   ├─ Cognitive Skills (add)
   │  ├─ Critical Thinking (add)
   │  ├─ Memory & Learning (add)
   │  └─ Problem Solving (add)
   ├─ Communication & Interpersonal (add)
   └─ Mindfulness & Wellness (add)

8. Health & Fitness (add as top-level)
   ├─ Fitness & Exercise (add)
   │  ├─ Strength Training (add)
   │  ├─ Cardio & Endurance (add)
   │  └─ Flexibility & Mobility (add)
   ├─ Nutrition & Diet (add)
   ├─ Mental Health (add)
   └─ Holistic Health (add)
      ├─ Yoga (add)
      ├─ Meditation (add)
      └─ Alternative Medicine (add)
```

**Migration Strategy:**
- Add missing categories to data/topics_seed_new_structure.json following the established structure
- Update existing category slugs/names as needed
- Assign all competencies to appropriate categories

---

## Understanding the New Structure

### Key Concepts

1. **Competencies** = Underlying skills/technologies (e.g., React, Python, Spanish)
   - Users search by competency
   - Each competency has synonyms for better search
   - Can have prerequisites (React requires JavaScript)
   - Can have alternatives (Flask ⇄ Django)

2. **Topics** = Outcome-oriented learning paths (e.g., "Building web applications with Python")
   - What the user will be able to do/make
   - Maps to one or more competencies
   - Has 0-1 primary competencies plus supporting ones (ex. "Redstone automation in Minecraft" would not likely be associated with a competency, but many people want to learn how to do it)
   - Belongs to a hierarchical category

3. **Categories** = Hierarchical organization (e.g., Info & Tech > Programming > Web Dev > Frontend)
   - Deep nesting via parent_id
   - Help users browse and discover

### Topic Naming Convention

✅ **Good Topic Names** (Action-oriented, outcome-focused):
- "Building web applications with Python"
- "Conversational Spanish"
- "Creating interactive UIs with React"
- "Automating repetitive tasks with Python"
- "Data analysis for business decisions"

❌ **Bad Topic Names** (Too generic, no clear outcome):
- "Python" (this is a competency, not a topic)
- "Learn React"
- "Spanish Language"
- "Web Development"

### What Users Should Be Able To Do

When creating topics, always think: **"What will the user be able to do after completing this?"**

Examples:
- **Topic:** "Conversational Spanish"
  - **Outcome:** Have basic conversations in Spanish
  - **Future Goal Option:** Travel abroad comfortably

- **Topic:** "Building web applications with Python"
  - **Outcome:** Create full-featured web apps from scratch
  - **Future Goal Option:** Get a new job / Build a SaaS product

- **Topic:** "Data visualization for business reports"
  - **Outcome:** Create compelling visual reports for stakeholders
  - **Future Goal Option:** Get promoted / Improve team decision-making

---

## Migration Strategy

### Phase 1: Category Alignment (DONE)
- [x] Created hierarchical category structure
- [x] Mapped old categories to new structure
- [x] Added icon support for visual browsing

### Phase 2: Incremental Expansion (CURRENT)

We'll work through the original topics systematically:

#### Step 1: Identify Categories to Add
Review original `topics_seed.json` and add missing top-level categories

#### Step 2: Transform Topics → Competencies
Most original topics should become competencies with appropriate synonyms

#### Step 3: Expand Competencies → Goal-Oriented Topics
For each competency, create 2-8 goal-oriented topics based on practical applications

#### Step 4: Add Prerequisites & Alternatives
Define relationships between competencies

---

## Expansion Batches

### Batch 1: Programming (Priority 1) 🟡 IN PROGRESS
**Original Topics:** 55 topics
**Target:** 200+ goal-oriented topics
**Status:** 3/200 complete (1.5%)

#### 1.1: Web Development (High Priority)
**Competencies to Add:**
- [x] React ✅ (already added)
- [x] Vue.js
- [x] Angular
- [ ] Node.js
- [ ] Next.js
- [ ] Express.js
- [ ] Django ✅ (already added)
- [ ] Flask ✅ (already added)
- [ ] Ruby on Rails
- [ ] PHP

**Look to existing expanded topics for examples:**

#### 1.2: Backend Development
**Competencies to Add:**
- [ ] SQL
- [ ] PostgreSQL
- [ ] MySQL
- [ ] MongoDB
- [ ] Redis
- [ ] GraphQL
- [ ] REST API design

#### 1.3: Programming Languages
**Competencies to Add:**
- [ ] JavaScript ✅ (already added)
- [x] TypeScript
- [ ] Python ✅ (already added)
- [ ] Java
- [ ] C++
- [ ] C#
- [ ] Go
- [ ] Rust
- [ ] Swift
- [ ] Kotlin
- [ ] Ruby

#### 1.4: Cloud & DevOps
**Competencies to Add:**
- [ ] Docker
- [ ] Kubernetes
- [ ] AWS
- [ ] Azure
- [ ] Google Cloud
- [ ] Git
- [ ] GitHub
- [ ] CI/CD
- [ ] DevOps

#### 1.5: Data Structures & Algorithms
**Competencies to Add:**
- [ ] Data Structures
- [ ] Algorithms
- [ ] System Design

#### 1.6: AI/ML
**Competencies to Add:**
- [ ] Machine Learning
- [ ] Deep Learning
- [ ] TensorFlow
- [ ] PyTorch

#### 1.7: Blockchain & Web3
**Competencies to Add:**
- [ ] Blockchain
- [ ] Web3
- [ ] Solidity

#### 1.8: Security
**Competencies to Add:**
- [ ] Cybersecurity

---

### Batch 2: Design (Priority 2)
**Original Topics:** 24 topics
**Target:** 80+ goal-oriented topics
**Status:** Not started

#### 2.1: UI/UX Design
**Competencies to Add:**
- [ ] UI Design
- [ ] UX Design
- [ ] Figma
- [ ] Adobe XD
- [ ] Sketch
- [ ] Prototyping
- [ ] Wireframing
- [ ] User Research
- [ ] Usability Testing

#### 2.2: Graphic Design
**Competencies to Add:**
- [ ] Graphic Design
- [ ] Logo Design
- [ ] Typography
- [ ] Color Theory
- [ ] Adobe Photoshop
- [ ] Adobe Illustrator

#### 2.3: Motion & 3D
**Competencies to Add:**
- [ ] Motion Graphics
- [ ] 3D Design
- [ ] Blender
- [ ] 2D Animation
- [ ] 3D Animation

---

### Batch 3: Data Science (Priority 2)
**Original Topics:** 24 topics
**Target:** 90+ goal-oriented topics
**Status:** Not started

#### 3.1: Data Analysis
**Competencies to Add:**
- [ ] Data Analysis
- [ ] Data Visualization
- [ ] Python for Data Science
- [ ] R Programming
- [ ] Pandas
- [ ] NumPy
- [ ] Matplotlib
- [ ] Seaborn
- [ ] Tableau
- [ ] Power BI
- [ ] Excel

#### 3.2: Statistics & Math
**Competencies to Add:**
- [ ] Statistics
- [ ] Probability

#### 3.3: Data Engineering
**Competencies to Add:**
- [ ] Data Engineering
- [ ] ETL
- [ ] SQL for Data Analysis
- [ ] Big Data
- [ ] Apache Spark
- [ ] Hadoop
- [ ] Data Warehousing

---

### Batch 4: Business (Priority 3)
**Original Topics:** 25 topics
**Target:** 75+ goal-oriented topics
**Status:** Not started

#### 4.1: Product & Project Management
**Competencies to Add:**
- [ ] Product Management
- [ ] Project Management
- [ ] Agile
- [ ] Scrum

#### 4.2: Marketing & Sales
**Competencies to Add:**
- [ ] Marketing
- [ ] Digital Marketing
- [ ] Content Marketing
- [ ] SEO
- [ ] Social Media Marketing
- [ ] Email Marketing
- [ ] Copywriting
- [ ] Sales

#### 4.3: Leadership & Communication
**Competencies to Add:**
- [ ] Leadership
- [ ] Public Speaking
- [ ] Negotiation
- [ ] Business Writing

#### 4.4: Business Operations
**Competencies to Add:**
- [ ] Entrepreneurship
- [ ] Business Strategy
- [ ] Financial Analysis
- [ ] Accounting
- [ ] Supply Chain Management
- [ ] Operations Management
- [ ] Human Resources

---

### Batch 5: Languages (Priority 2)
**Original Topics:** 15 topics
**Target:** 60+ goal-oriented topics
**Status:** 1/60 complete (1.7%)

#### 5.1: Major Languages
**Competencies to Add:**
- [x] Spanish ✅ (already added)
- [ ] French
- [ ] German
- [ ] Italian
- [ ] Mandarin Chinese
- [ ] Japanese
- [ ] Korean
- [ ] Arabic
- [ ] Portuguese
- [ ] Russian
- [ ] Hindi

#### 5.2: Language Skills
**Competencies to Add:**
- [ ] Grammar
- [ ] Vocabulary Building
- [ ] Pronunciation
- [ ] English as a Second Language (ESL)

---

### Batch 6: Mathematics (Priority 4)
**Original Topics:** 12 topics
**Target:** 40+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Algebra
- [ ] Calculus
- [ ] Linear Algebra
- [ ] Discrete Mathematics
- [ ] Trigonometry
- [ ] Geometry
- [ ] Differential Equations
- [ ] Number Theory
- [ ] Combinatorics
- [ ] Graph Theory

---

### Batch 7: Science (Priority 4)
**Original Topics:** 12 topics
**Target:** 40+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Physics
- [ ] Chemistry
- [ ] Biology
- [ ] Astronomy
- [ ] Genetics
- [ ] Quantum Mechanics
- [ ] Environmental Science
- [ ] Neuroscience
- [ ] Anatomy
- [ ] Physiology

---

### Batch 8: Personal Development (Priority 3)
**Original Topics:** 15 topics
**Target:** 50+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Time Management
- [ ] Goal Setting
- [ ] Mindfulness
- [ ] Emotional Intelligence
- [ ] Critical Thinking
- [ ] Problem Solving
- [ ] Communication Skills
- [ ] Study Skills
- [ ] Memory Improvement
- [ ] Speed Reading

---

### Batch 9: Creative Arts (Priority 3)
**Original Topics:** 15 topics
**Target:** 60+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Photography
- [ ] Video Editing
- [ ] Music Theory
- [ ] Guitar
- [ ] Piano
- [ ] Drawing
- [ ] Painting
- [ ] Digital Art
- [ ] Creative Writing
- [ ] Screenwriting
- [ ] Film Making
- [ ] Animation

---

### Batch 10: Health & Fitness (Priority 3)
**Original Topics:** 15 topics
**Target:** 50+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Yoga
- [ ] Meditation
- [ ] Weight Training
- [ ] Running
- [ ] Nutrition
- [ ] Meal Planning

---

### Batch 11: Finance (Priority 3)
**Original Topics:** 15 topics
**Target:** 50+ goal-oriented topics
**Status:** Not started

**Competencies to Add:**
- [ ] Personal Finance
- [ ] Investing
- [ ] Stock Market
- [ ] Cryptocurrency
- [ ] Real Estate Investing
- [ ] Trading
- [ ] Budgeting
- [ ] Tax Planning

---

## Prerequisites & Alternatives Strategy

As we add competencies, we should also define their relationships:

### Common Prerequisites Patterns

1. **Web Development:**
   - React/Vue/Angular → JavaScript
   - Next.js → React → JavaScript
   - Django/Flask → Python

2. **Data Science:**
   - Pandas/NumPy → Python
   - TensorFlow/PyTorch → Python, Machine Learning basics

3. **Mobile:**
   - React Native → React → JavaScript
   - Swift → Programming fundamentals

4. **Backend:**
   - Express.js → Node.js → JavaScript
   - FastAPI → Python

### Common Alternatives Patterns

1. **Web Frameworks:**
   - Flask ⇄ Django (both Python)
   - Express ⇄ Fastify ⇄ Koa (all Node.js)

2. **Frontend:**
   - React ⇄ Vue ⇄ Angular
   - Next.js ⇄ Nuxt.js ⇄ SvelteKit

3. **Databases:**
   - MySQL ⇄ PostgreSQL (relational)
   - MongoDB ⇄ CouchDB (document)

---

## Session Workflow

### For Each Session:

1. **Pick a Batch** (start with Batch 1: Programming)

2. **Select 5-10 Competencies** to work on

3. **For Each Competency:**
   - Add competency with name, slug, description, category
   - Add 3-5 synonyms
   - Define prerequisites (if any)
   - Define alternatives (if any)
   - Create 2-8 goal-oriented topics

4. **Update This Document:**
   - Check off completed competencies
   - Update progress counters
   - Add any notes or learnings

5. **Regenerate Seeds:**
   ```bash
   npm run generate:seeds
   supabase db reset
   ```

6. **Test Search:**
   - Verify new competencies appear in typeahead
   - Test synonym matching
   - Check category browsing

---

## Quality Checklist

Before marking a batch as complete, verify:

- [ ] All topics are action-oriented and outcome-focused
- [ ] Each topic clearly maps to competencies
- [ ] No duplicate slugs across topics/competencies
- [ ] All slugs follow kebab-case convention
- [ ] Synonyms cover common variations and search terms
- [ ] Prerequisites are logically ordered (beginner → advanced)
- [ ] Alternatives are truly interchangeable or similar
- [ ] Categories are correctly assigned (use most specific category)
- [ ] Descriptions are clear and helpful for users

---

## Progress Tracking

### Overall Progress
- **Total Topics:** 3 / 1000+
- **Total Competencies:** 8 / 300+
- **Total Categories:** 12 / 15+

### Batch Completion
- [ ] Batch 1: Programming (0%)
- [ ] Batch 2: Design (0%)
- [ ] Batch 3: Data Science (0%)
- [ ] Batch 4: Business (0%)
- [ ] Batch 5: Languages (1.7%)
- [ ] Batch 6: Mathematics (0%)
- [ ] Batch 7: Science (0%)
- [ ] Batch 8: Personal Development (0%)
- [ ] Batch 9: Creative Arts (0%)
- [ ] Batch 10: Health & Fitness (0%)
- [ ] Batch 11: Finance (0%)

---

## Notes & Learnings

### Session 1 (Nov 20, 2025) - Planning & Architecture
**Duration:** ~2 hours
**Focus:** Planning, schema design, and documentation

**Accomplishments:**
- ✅ Created initial plan structure with 11 batches
- ✅ Identified ~1000+ topics target (conservative estimate)
- ✅ Documented Q&A context for future sessions
- ✅ Designed schema changes:
  - Change `is_required` → `prerequisite_level` enum (required/recommended/optional)
  - Add `user_competencies` table for proficiency tracking
- ✅ Proposed final category hierarchy (8 top-level, ~60 total)
- ✅ Clarified competency assignment strategy (Python→Programming, Flask→Backend, Pandas→Data Science)
- ✅ Defined proficiency architecture (user-declared, not topic-defined)

**Key Decisions:**
1. **Category Structure:** Expand from 4 to 8 top-level categories, with Finance nested under Business and Creative Arts nested under Design
2. **Prerequisites:** Three-level system (required/recommended/optional) instead of boolean
3. **Proficiency:** User-declared competency proficiency, not hard-coded in topics
4. **Expansion Velocity:** Work in manageable batches across sessions to avoid context limits

**Next Session Goals:**
1. Implement schema changes (migrations for prerequisite_level)
2. Begin Batch 1.1 (Web Development) expansion
3. Add 5-10 competencies with full expansion (30-60 topics)

---

## Next Steps

### Before Next Session (Schema Changes)
1. **Create Migration:** `prerequisite_level` enum
   - File: `supabase/migrations/YYYYMMDD_change_prerequisite_level.sql`
   - Migrate existing data: `true` → `'required'`, `false` → `'optional'`
   - Update seed generation script
   - Update seed data

2. **Optional:** Create `user_competencies` table
   - Can defer to post-expansion if needed
   - High value for prerequisite checking in path generation

### Next Session: Batch 1.1 Web Development
1. **Add Web Development Competencies:**
   - React, Vue.js, Angular (frontend frameworks)
   - Node.js, Express.js (backend runtime/framework)
   - Next.js, Nuxt.js (meta-frameworks)
   - Svelte, SvelteKit (modern alternatives)
   - TypeScript (typing layer)
   - HTML, CSS (already added ✅)

2. **For Each Competency:**
   - Add to `competencies` array with proper category assignment
   - Add 3-5 synonyms
   - Define prerequisites with appropriate levels
   - Define alternatives where applicable
   - Create 5-8 goal-oriented topics
   - Aim for 30-60 total topics in this session

3. **Generate & Test:**
   - Run `npm run generate:seeds`
   - Run `supabase db reset`
   - Test search and browsing
   - Verify category hierarchy

### Short-term (Sessions 2-4)
- Complete Batch 1 (Programming) - highest value
- ~200 topics covering all programming subcategories
- Will provide immediate value to tech-focused users

### Medium-term (Sessions 5-10)
- Complete Batches 2-5 (Design, Data Science, Business, Languages)
- Diverse content for different user personas
- ~300-400 additional topics

### Long-term (Sessions 11+)
- Complete remaining batches (Math, Science, Personal Dev, Health, Finance)
- Comprehensive coverage across all domains
- ~300-400 additional topics

---

**Document Status:** Planning complete, ready for schema changes & expansion
**Last Updated:** November 20, 2025
**Next Session:** Implement schema changes, then begin Batch 1.1 Web Development expansion
