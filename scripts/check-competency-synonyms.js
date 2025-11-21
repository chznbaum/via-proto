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

    // Check for duplicate slugified synonyms within same competency
    const slugMap = new Map();
    const duplicates = [];

    comp.synonyms.forEach(synonym => {
      const slug = slugify(synonym);

      // Check if this slug already exists for this competency
      if (slugMap.has(slug)) {
        duplicates.push({
          original1: slugMap.get(slug),
          original2: synonym,
          slug
        });
      } else {
        slugMap.set(slug, synonym);
      }

      // Also track across all competencies
      if (allSlugs.has(slug)) {
        // This is a cross-competency duplicate (might be intentional)
      } else {
        allSlugs.add(slug);
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
  console.log('=== DUPLICATE SLUGIFIED SYNONYMS ===\n');
  console.log('These synonyms will create duplicate keys in the database:\n');

  issues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Competency: ${issue.competency} (${issue.slug})`);
    console.log('Duplicate slugs found:');
    issue.duplicates.forEach(dup => {
      console.log(`  - "${dup.original1}" and "${dup.original2}" both slugify to "${dup.slug}"`);
    });
    console.log('All synonyms:', issue.allSynonyms.join(', '));
    console.log('');
  });

  console.log(`\n❌ Found ${issues.length} competenc${issues.length === 1 ? 'y' : 'ies'} with duplicate slugified synonyms`);
  console.log('\nTo fix: Remove or rename synonyms so they slugify differently');
  process.exit(1);
} else {
  console.log('✅ No duplicate slugified synonyms found!');
  process.exit(0);
}
