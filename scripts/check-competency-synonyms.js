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

const issues = [];
const allSlugs = new Set();

competencyFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!data.competencies) return;

  data.competencies.forEach(comp => {
    if (!comp.synonyms || comp.synonyms.length === 0) return;

    // Check for case-insensitive duplicate synonyms within same competency
    const lowerMap = new Map();
    const duplicates = [];

    comp.synonyms.forEach(synonym => {
      const lower = synonym.toLowerCase();

      // Check if this case-insensitive synonym already exists for this competency
      if (lowerMap.has(lower)) {
        duplicates.push({
          original1: lowerMap.get(lower),
          original2: synonym,
          lower
        });
      } else {
        lowerMap.set(lower, synonym);
      }

      // Also track across all competencies
      if (allSlugs.has(lower)) {
        // This is a cross-competency duplicate (might be intentional)
      } else {
        allSlugs.add(lower);
      }
    });

    if (duplicates.length > 0) {
      issues.push({
        file: path.basename(file),
        competency: comp.name,
        slug: comp.slug,
        duplicates,
        allSynonyms: comp.synonyms
      });
    }
  });
});

if (issues.length > 0) {
  console.log('=== DUPLICATE CASE-INSENSITIVE SYNONYMS ===\n');
  console.log('These synonyms will create duplicate keys in the database:\n');

  issues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Competency: ${issue.competency} (${issue.slug})`);
    console.log('Duplicate case-insensitive synonyms found:');
    issue.duplicates.forEach(dup => {
      console.log(`  - "${dup.original1}" and "${dup.original2}" both become "${dup.lower}" when lowercased`);
    });
    console.log('All synonyms:', issue.allSynonyms.join(', '));
    console.log('');
  });

  console.log(`\n❌ Found ${issues.length} competenc${issues.length === 1 ? 'y' : 'ies'} with duplicate case-insensitive synonyms`);
  console.log('\nTo fix: Remove or rename synonyms so they are unique when lowercased');
  process.exit(1);
} else {
  console.log('✅ No duplicate case-insensitive synonyms found!');
  process.exit(0);
}
