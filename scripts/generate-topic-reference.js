#!/usr/bin/env node

/**
 * Generate a comprehensive reference of all existing topics
 * for use during seed expansion to avoid duplicates and plan coverage.
 *
 * Output:
 * - data/seeds/TOPIC_REFERENCE.md (detailed)
 * - data/seeds/TOPIC_QUICK_LOOKUP.md (simple list)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const TOPICS_DIR = path.join(__dirname, '../data/seeds/topics');
const OUTPUT_FILE = path.join(__dirname, '../data/seeds/TOPIC_REFERENCE.md');
const QUICK_LOOKUP_FILE = path.join(__dirname, '../data/seeds/TOPIC_QUICK_LOOKUP.md');

function loadAllTopics() {
  const files = fs.readdirSync(TOPICS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const allTopics = [];

  for (const file of files) {
    const filePath = path.join(TOPICS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    if (data.topics && Array.isArray(data.topics)) {
      for (const topic of data.topics) {
        allTopics.push({
          ...topic,
          source_file: file
        });
      }
    }
  }

  return allTopics;
}

function groupByCategory(topics) {
  const grouped = {};

  for (const topic of topics) {
    const category = topic.category_slug || 'uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(topic);
  }

  // Sort topics within each category by name
  for (const category in grouped) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  return grouped;
}

function generateQuickLookup(topics) {
  const grouped = groupByCategory(topics);
  const categories = Object.keys(grouped).sort();

  let md = `# Topic Quick Lookup\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Topics:** ${topics.length}\n\n`;
  md += `This file is auto-generated for quick reference during seed expansion.\n`;
  md += `Run \`npm run generate:topic-reference\` to update.\n\n`;
  md += `For detailed information (competencies, descriptions), see TOPIC_REFERENCE.md\n\n`;
  md += `---\n\n`;

  // Table of Contents - Categories with counts
  md += `## Categories\n\n`;
  for (const category of categories) {
    const count = grouped[category].length;
    md += `- **${category}** (${count})\n`;
  }
  md += `\n---\n\n`;

  // Alphabetical list of all slugs
  md += `## Alphabetical by Slug\n\n`;
  const sorted = [...topics].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const topic of sorted) {
    const primaryComps = topic.competencies
      ?.filter(c => c.is_primary)
      .map(c => c.competency_slug)
      .join(', ') || 'none';
    md += `- \`${topic.slug}\` - ${topic.name} (${topic.category_slug}) [Primary: ${primaryComps}]\n`;
  }
  md += `\n`;

  return md;
}

function generateMarkdown(topics) {
  const grouped = groupByCategory(topics);
  const categories = Object.keys(grouped).sort();

  let md = `# Topic Reference (Detailed)\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Total Topics:** ${topics.length}\n\n`;
  md += `This file is auto-generated for reference during seed expansion.\n`;
  md += `Run \`npm run generate:topic-reference\` to update.\n\n`;
  md += `For a quick alphabetical lookup without details, see TOPIC_QUICK_LOOKUP.md\n\n`;
  md += `---\n\n`;

  // Table of Contents
  md += `## Table of Contents\n\n`;
  for (const category of categories) {
    const count = grouped[category].length;
    md += `- [${category}](#${category.replace(/[^a-z0-9]+/g, '-')}) (${count})\n`;
  }
  md += `\n---\n\n`;

  // Detailed sections by category
  for (const category of categories) {
    md += `## ${category}\n\n`;

    for (const topic of grouped[category]) {
      md += `### ${topic.name}\n`;
      md += `- **Slug:** \`${topic.slug}\`\n`;
      md += `- **Description:** ${topic.description}\n`;

      if (topic.competencies && topic.competencies.length > 0) {
        const primary = topic.competencies.filter(c => c.is_primary);
        const nonPrimary = topic.competencies.filter(c => !c.is_primary);

        if (primary.length > 0) {
          md += `- **Primary Competencies:** ${primary.map(c => `\`${c.competency_slug}\``).join(', ')}\n`;
        }

        if (nonPrimary.length > 0) {
          md += `- **Supporting Competencies:** ${nonPrimary.map(c => `\`${c.competency_slug}\``).join(', ')}\n`;
        }
      } else {
        md += `- **Competencies:** None\n`;
      }

      md += `- **Source File:** ${topic.source_file}\n`;
      md += `\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

function validateCompetencyReferences(topics) {
  const issues = [];
  const allCompetencySlugs = new Set();

  // Load all competencies to validate references
  const compFiles = glob.sync('data/seeds/competencies/*.json');
  compFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.competencies) {
      data.competencies.forEach(c => allCompetencySlugs.add(c.slug));
    }
  });

  for (const topic of topics) {
    if (topic.competencies) {
      for (const comp of topic.competencies) {
        if (!allCompetencySlugs.has(comp.competency_slug)) {
          issues.push({
            type: 'missing_competency',
            topic: topic.slug,
            file: topic.source_file,
            missing: comp.competency_slug
          });
        }
      }
    }
  }

  return issues;
}

function main() {
  console.log('Loading all topics...');
  const topics = loadAllTopics();

  console.log(`Found ${topics.length} topics`);

  console.log('Validating competency references...');
  const issues = validateCompetencyReferences(topics);

  if (issues.length > 0) {
    console.log('\n⚠️  Reference Issues Found:');
    for (const issue of issues) {
      console.log(`  - ${issue.topic} (${issue.file}): ${issue.type} - "${issue.missing}" does not exist`);
    }
    console.log('');
  } else {
    console.log('✓ All competency references are valid');
  }

  console.log('Generating markdown references...');

  const quickLookup = generateQuickLookup(topics);
  fs.writeFileSync(QUICK_LOOKUP_FILE, quickLookup, 'utf8');
  console.log(`✓ Quick lookup generated: ${QUICK_LOOKUP_FILE}`);

  const markdown = generateMarkdown(topics);
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');
  console.log(`✓ Detailed reference generated: ${OUTPUT_FILE}`);

  // Summary stats
  const byCategory = groupByCategory(topics);
  console.log('\nTopics by Category:');
  for (const [category, topicList] of Object.entries(byCategory).sort()) {
    console.log(`  ${category}: ${topicList.length}`);
  }

  if (issues.length > 0) {
    console.log('\n⚠️  Warning: Reference issues found. Fix before proceeding with expansion.');
    process.exit(1);
  }
}

main();
