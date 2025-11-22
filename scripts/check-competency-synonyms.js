const fs = require('fs');
const path = require('path');
const glob = require('glob');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Find all competency JSON files
const competencyFiles = glob.sync('data/seeds/competencies/*.json');

const synonymIssues = [];
const allSlugs = new Set();
const nameIssues = [];
const nameMap = new Map(); // Track competency names and where they appear
const relationshipIssues = [];

const VALID_RELATIONSHIP_TYPES = ['similar', 'related', 'replaces'];

competencyFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!data.competencies) return;

  data.competencies.forEach(comp => {
    // Check for duplicate competency names
    const lowerName = comp.name.toLowerCase();
    if (nameMap.has(lowerName)) {
      const existing = nameMap.get(lowerName);
      if (!nameIssues.find(issue => issue.name === comp.name)) {
        nameIssues.push({
          name: comp.name,
          occurrences: [
            { file: existing.file, slug: existing.slug },
            { file: path.basename(file), slug: comp.slug }
          ]
        });
      } else {
        // Add to existing issue
        const issue = nameIssues.find(issue => issue.name === comp.name);
        issue.occurrences.push({ file: path.basename(file), slug: comp.slug });
      }
    } else {
      nameMap.set(lowerName, {
        file: path.basename(file),
        slug: comp.slug,
        name: comp.name
      });
    }

    // Check for invalid relationship types in alternatives
    if (comp.alternatives && comp.alternatives.length > 0) {
      comp.alternatives.forEach(alt => {
        if (alt.relationship_type && !VALID_RELATIONSHIP_TYPES.includes(alt.relationship_type)) {
          relationshipIssues.push({
            file: path.basename(file),
            competency: comp.name,
            slug: comp.slug,
            alternative: alt.alternative_slug,
            invalidType: alt.relationship_type
          });
        }
      });
    }

    // Check for duplicate synonyms (existing check)
    if (!comp.synonyms || comp.synonyms.length === 0) return;

    const lowerMap = new Map();
    const duplicates = [];

    comp.synonyms.forEach(synonym => {
      const lower = synonym.toLowerCase();

      if (lowerMap.has(lower)) {
        duplicates.push({
          original1: lowerMap.get(lower),
          original2: synonym,
          lower
        });
      } else {
        lowerMap.set(lower, synonym);
      }

      if (allSlugs.has(lower)) {
        // This is a cross-competency duplicate (might be intentional)
      } else {
        allSlugs.add(lower);
      }
    });

    if (duplicates.length > 0) {
      synonymIssues.push({
        file: path.basename(file),
        competency: comp.name,
        slug: comp.slug,
        duplicates,
        allSynonyms: comp.synonyms
      });
    }
  });
});

// Report all issues
let hasErrors = false;

if (synonymIssues.length > 0) {
  hasErrors = true;
  console.log('=== DUPLICATE CASE-INSENSITIVE SYNONYMS ===\n');
  console.log('These synonyms will create duplicate keys in the database:\n');

  synonymIssues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Competency: ${issue.competency} (${issue.slug})`);
    console.log('Duplicate case-insensitive synonyms found:');
    issue.duplicates.forEach(dup => {
      console.log(`  - "${dup.original1}" and "${dup.original2}" both become "${dup.lower}" when lowercased`);
    });
    console.log('All synonyms:', issue.allSynonyms.join(', '));
    console.log('');
  });

  console.log(`\n❌ Found ${synonymIssues.length} competenc${synonymIssues.length === 1 ? 'y' : 'ies'} with duplicate case-insensitive synonyms`);
  console.log('\nTo fix: Remove or rename synonyms so they are unique when lowercased\n');
}

if (nameIssues.length > 0) {
  hasErrors = true;
  console.log('=== DUPLICATE COMPETENCY NAMES ===\n');
  console.log('These competencies have the same name:\n');

  nameIssues.forEach(issue => {
    console.log(`Name: "${issue.name}"`);
    console.log('Found in:');
    issue.occurrences.forEach(occ => {
      console.log(`  - File: ${occ.file}, Slug: ${occ.slug}`);
    });
    console.log('');
  });

  console.log(`\n❌ Found ${nameIssues.length} duplicate competency name${nameIssues.length === 1 ? '' : 's'}`);
  console.log('\nTo fix: Ensure each competency has a unique name (case-insensitive)\n');
}

if (relationshipIssues.length > 0) {
  hasErrors = true;
  console.log('=== INVALID RELATIONSHIP TYPES ===\n');
  console.log(`Valid relationship types are: ${VALID_RELATIONSHIP_TYPES.join(', ')}\n`);

  relationshipIssues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Competency: ${issue.competency} (${issue.slug})`);
    console.log(`Alternative: ${issue.alternative}`);
    console.log(`Invalid relationship_type: "${issue.invalidType}"`);
    console.log('');
  });

  console.log(`\n❌ Found ${relationshipIssues.length} invalid relationship type${relationshipIssues.length === 1 ? '' : 's'}`);
  console.log(`\nTo fix: Use only: ${VALID_RELATIONSHIP_TYPES.join(', ')}\n`);
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ No duplicate case-insensitive synonyms found!');
  console.log('✅ No duplicate competency names found!');
  console.log('✅ All relationship types are valid!');
  process.exit(0);
}
