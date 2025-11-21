# Seed Data Files

This directory contains modular seed data for the ViaProto database. The data is split into manageable JSON files that are combined into SQL during the build process.

## Directory Structure

```
data/seeds/
├── categories.json          # All categories (flat with parent_slug)
├── competencies/            # Competencies by domain
│   ├── programming.json
│   ├── web-development.json
│   └── ... (add more as needed)
├── topics/                  # Topics by domain
│   ├── programming.json
│   ├── web-development.json
│   └── ... (add more as needed)
└── unsplash_images.json    # Unsplash image references
```

## File Formats

### categories.json
Flat array of categories with `parent_slug` references:
```json
{
  "categories": [
    {
      "name": "Information & Technology",
      "slug": "information-technology",
      "description": "Technology, software, and digital skills",
      "icon": "lucide:computer",
      "display_order": 1,
      "parent_slug": null
    }
  ]
}
```

### competencies/{domain}.json
Competencies with embedded prerequisites and alternatives:
```json
{
  "competencies": [
    {
      "name": "React",
      "slug": "react",
      "description": "JavaScript library for building user interfaces",
      "category_slug": "frontend-development",
      "icon": "logos:react",
      "synonyms": ["React.js", "ReactJS"],
      "prerequisites": [
        {
          "prerequisite_slug": "javascript",
          "prerequisite_level": "required",
          "notes": "JavaScript fundamentals required"
        }
      ],
      "alternatives": [
        {
          "alternative_slug": "vuejs",
          "relationship_type": "similar",
          "notes": "Vue.js is a similar framework"
        }
      ]
    }
  ]
}
```

### topics/{domain}.json
Topics with competency associations:
```json
{
  "topics": [
    {
      "name": "Building interactive UIs with React",
      "slug": "building-interactive-uis-with-react",
      "description": "Learn to create dynamic UIs",
      "category_slug": "frontend-development",
      "competencies": [
        {
          "competency_slug": "react",
          "is_primary": true
        }
      ]
    }
  ]
}
```

### unsplash_images.json
Unsplash image references:
```json
{
  "images": [
    {
      "photo_id": "...",
      "url": "...",
      "photographer": "...",
      "photographer_username": "...",
      "photographer_url": "...",
      "download_location": "...",
      "alt_description": "...",
      "usage_note": "Used on /tos page"
    }
  ]
}
```

## Workflow

### 1. Edit Seed Data
Edit the JSON files in this directory. Add new domain files as needed.

### 2. Generate SQL
Combine all JSON files into `supabase/seed.sql`:
```bash
npm run generate:seed
```

### 3. Apply to Database
Reset the database with the new seed data:
```bash
supabase db reset
```

CRITICAL RULE: You should ensure competencies are comprehensive before beginning any additional work on expanding topics. Adding competencies is largely a matter of recall and research, while adding topics is more a matter of generating new expressions. These are better done separately from each other so you can optimize for each task. By comprehensive, keep in mind that the intent is for users to be able to learn about nearly anything they want to using this app.

## Domain Guidelines

When adding new competencies or topics, use these domain files:

- **programming.json** - Core programming languages and concepts
- **web-development.json** - Web frameworks, tools, frontend/backend
- **data-science.json** - Data analysis, ML, visualization
- **design.json** - UI/UX, graphic design
- **business.json** - Business, management, entrepreneurship
- **languages.json** - Natural and constructed languages
- **mathematics.json** - Math topics at all levels
- **science.json** - Physical, life, earth sciences
- **personal-development.json** - Productivity, communication, leadership
- **creative-arts.json** - Music, photography, writing, theater, visual arts
- **health-fitness.json** - Physical fitness, nutrition, mental health
- **finance.json** - Finance and accounting
- **home-lifestyle.json** - Cooking, gardening, auto repair, home improvement
- **games-recreation.json** - Tabletop games, video games, sports
- **fiber-arts.json** - Textile arts, sewing, knitting, crafts

Add new domain files as the platform expands to new areas.

## Synonym Guidelines
CRITICAL RULE: Do not create multiple synonyms that would share the same slug (ie.: WASM, wasm). Synonyms are for making searching and matching more user-friendly and those activities will be done case-insensitively. If you create multiple synonyms that would slugify the same way, you will cause a duplicate key value violates unique constraint error in the database.

## Icon Format

All icons use the iconify format with **strict rules** for each data type:

### Categories
- **Must use**: `lucide:icon-name` format (e.g., `lucide:computer`, `lucide:code-2`)
- Categories always use Lucide icons for consistent visual style
- Browse at: https://icon-sets.iconify.design/lucide/

### Competencies
- **Must use**: Branded logos only - either `logos:` or `devicon:` prefixes
- **First choice**: `logos:` set (e.g., `logos:react`, `logos:typescript-icon`)
  - Browse at: https://icon-sets.iconify.design/logos/
  - Available icons listed in: `data/iconify/logos.json`
- **Second choice**: `devicon:` set as fallback (e.g., `devicon:bootstrap`, `devicon:matlab`)
  - Browse at: https://icon-sets.iconify.design/devicon/
  - Available icons listed in: `data/iconify/devicon.json`
- **Never use**: Generic icons (like `lucide:code-2`) for competencies
- **If no logo exists**: Omit the `icon` field entirely rather than using a generic icon

### Topics
- Topics do not have icons

### Icon Reference Files
The project maintains local JSON files with available icons from each set:
- `data/iconify/logos.json` - Full list of logos icons
- `data/iconify/devicon.json` - Full list of devicon icons
- `data/iconify/lucide.json` - Full list of lucide icons
- `data/iconify/tabler.json` - Full list of tabler icons

To verify an icon exists before using it:
```bash
# Check if React icon exists in logos
grep -i '"react"' data/iconify/logos.json

# Check if Python icon exists in devicon
grep -i '"python"' data/iconify/devicon.json
```

### Common Icon Patterns
**Programming Languages**: Usually `logos:{language}` or `devicon:{language}`
- JavaScript: `logos:javascript`
- Python: `logos:python`
- TypeScript: `logos:typescript-icon`
- C++: `logos:c-plusplus`
- C#: `logos:c-sharp`
- Bash: `logos:bash-icon`

**Web Frameworks**: Usually have `-icon` suffix in logos set
- React: `logos:react`
- Vue: `logos:vue`
- Angular: `logos:angular-icon`

**Note**: Some icons have variants like `-icon`, `-wordmark`, etc. Prefer the icon variant for competencies.

## Notes

- **Competencies = Skills**: Focus on learnable skills, not passive activities
- **Empty competencies allowed**: Topics can have `competencies: []` if no specific skills apply
- **Prerequisite levels**: Use `required`, `recommended`, or `optional`
- **Category hierarchy**: Categories reference parents via `parent_slug` for easy parsing
- **File size**: Keep domain files under 1000 lines for maintainability

## Validation

Before committing changes:
1. Run `npm run generate:seed` to check for JSON errors
2. Run `supabase db reset` to test SQL generation
3. Verify the app loads correctly at http://localhost:3001
