#!/usr/bin/env node

/**
 * Generate a comprehensive reference of all existing competencies
 * for use during seed expansion to avoid duplicates and check prerequisites.
 *
 * Output: data/seeds/COMPETENCY_REFERENCE.md
 */

const fs = require('fs');
const path = require('path');

const COMPETENCIES_DIR = path.join(__dirname, '../data/seeds/competencies');
const OUTPUT_FILE = path.join(__dirname, '../data/seeds/COMPETENCY_REFERENCE.md');

function loadAllCompetencies() {
  const files = fs.readdirSync(COMPETENCIES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const allCompetencies = [];

  for (const file of files) {
    const filePath = path.join(COMPETENCIES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (data.competencies && Array.isArray(data.competencies)) {
      for (const comp of data.competencies) {
        allCompetencies.push({
          ...comp,
          source_file: file
        });
      }
    }
  }

  return allCompetencies;
}

function groupByCategory(competencies) {
  const grouped = {};

  for (const comp of competencies) {
    const category = comp.category_slug || 'uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(comp);
  }

  // Sort competencies within each category by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  return grouped;
}

function generateMarkdown(competencies) {
  const grouped = groupByCategory(competencies);
  const categories = Object.keys(grouped).sort();

  let md = `# Competency Reference\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Competencies:** ${competencies.length}\n\n`;
  md += `This file is auto-generated for reference during seed expansion.\n`;
  md += `Run \`npm run generate:competency-reference\` to update.\n\n`;
  md += `---\n\n`;

  // Table of Contents
  md += `## Table of Contents\n\n`;
  for (const category of categories) {
    const count = grouped[category].length;
    md += `- [${category}](#${category.replace(/[^a-z0-9]+/g, '-')}) (${count})\n`;
  }
  md += `\n---\n\n`;

  // Quick Lookup - Alphabetical list of all slugs
  md += `## Quick Lookup (Alphabetical by Slug)\n\n`;
  const sorted = [...competencies].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const comp of sorted) {
    md += `- \`${comp.slug}\` - ${comp.name} (${comp.category_slug})\n`;
  }
  md += `\n---\n\n`;

  // Detailed sections by category
  for (const category of categories) {
    md += `## ${category}\n\n`;

    for (const comp of grouped[category]) {
      md += `### ${comp.name}\n`;
      md += `- **Slug:** \`${comp.slug}\`\n`;
      md += `- **File:** \`${comp.source_file}\`\n`;

      if (comp.icon) {
        md += `- **Icon:** \`${comp.icon}\`\n`;
      }

      if (comp.synonyms && comp.synonyms.length > 0) {
        md += `- **Synonyms:** ${comp.synonyms.join(', ')}\n`;
      }

      if (comp.description) {
        md += `- **Description:** ${comp.description}\n`;
      }

      if (comp.prerequisites && comp.prerequisites.length > 0) {
        md += `- **Prerequisites:**\n`;
        for (const prereq of comp.prerequisites) {
          md += `  - \`${prereq.prerequisite_slug}\` (${prereq.prerequisite_level})`;
          if (prereq.notes) {
            md += ` - ${prereq.notes}`;
          }
          md += `\n`;
        }
      }

      if (comp.alternatives && comp.alternatives.length > 0) {
        md += `- **Alternatives:**\n`;
        for (const alt of comp.alternatives) {
          md += `  - \`${alt.alternative_slug}\` (${alt.relationship_type})`;
          if (alt.notes) {
            md += ` - ${alt.notes}`;
          }
          md += `\n`;
        }
      }

      md += `\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

function validateReferences(competencies) {
  const slugSet = new Set(competencies.map(c => c.slug));
  const issues = [];

  for (const comp of competencies) {
    // Check prerequisites
    if (comp.prerequisites) {
      for (const prereq of comp.prerequisites) {
        if (!slugSet.has(prereq.prerequisite_slug)) {
          issues.push({
            type: 'missing_prerequisite',
            competency: comp.slug,
            file: comp.source_file,
            missing: prereq.prerequisite_slug
          });
        }
      }
    }

    // Check alternatives
    if (comp.alternatives) {
      for (const alt of comp.alternatives) {
        if (!slugSet.has(alt.alternative_slug)) {
          issues.push({
            type: 'missing_alternative',
            competency: comp.slug,
            file: comp.source_file,
            missing: alt.alternative_slug
          });
        }
      }
    }
  }

  return issues;
}

function main() {
  console.log('Loading all competencies...');
  const competencies = loadAllCompetencies();

  console.log(`Found ${competencies.length} competencies`);

  console.log('Validating references...');
  const issues = validateReferences(competencies);

  if (issues.length > 0) {
    console.log('\n⚠️  Reference Issues Found:');
    for (const issue of issues) {
      console.log(`  - ${issue.competency} (${issue.file}): ${issue.type} - "${issue.missing}" does not exist`);
    }
    console.log('');
  } else {
    console.log('✓ All prerequisite and alternative references are valid');
  }

  console.log('Generating markdown reference...');
  const markdown = generateMarkdown(competencies);

  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');
  console.log(`✓ Reference generated: ${OUTPUT_FILE}`);

  // Summary stats
  const byCategory = groupByCategory(competencies);
  console.log('\nCompetencies by Category:');
  for (const [category, comps] of Object.entries(byCategory).sort()) {
    console.log(`  ${category}: ${comps.length}`);
  }

  if (issues.length > 0) {
    console.log('\n⚠️  Warning: Reference issues found. Fix before proceeding with expansion.');
    process.exit(1);
  }
}

main();
