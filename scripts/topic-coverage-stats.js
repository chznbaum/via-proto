#!/usr/bin/env node

/**
 * Generate topic coverage statistics across categories
 *
 * Outputs:
 * - Console: Summary statistics
 * - data/seeds/TOPIC_COVERAGE_TREE.md: Full category tree with topic counts
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const TREE_OUTPUT = path.join(__dirname, '../data/seeds/TOPIC_COVERAGE_TREE.md');

// Load all categories
function loadAllCategories() {
  const categoriesFile = path.join(__dirname, '../data/seeds/categories.json');
  const data = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
  return data.categories || [];
}

// Load all topics
function loadAllTopics() {
  const files = glob.sync('data/seeds/topics/*.json');
  const allTopics = [];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.topics) {
      data.topics.forEach(topic => {
        allTopics.push(topic);
      });
    }
  });

  return allTopics;
}

// Load all competencies
function loadAllCompetencies() {
  const files = glob.sync('data/seeds/competencies/*.json');
  const allCompetencies = [];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.competencies) {
      data.competencies.forEach(comp => {
        allCompetencies.push(comp);
      });
    }
  });

  return allCompetencies;
}

// Count topics per category
function countTopicsByCategory(topics) {
  const counts = {};

  topics.forEach(topic => {
    const category = topic.category_slug || 'uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

// Count competencies per category
function countCompetenciesByCategory(competencies) {
  const counts = {};

  competencies.forEach(comp => {
    const category = comp.category_slug || 'uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
}

// Build category tree structure
function buildCategoryTree(categories) {
  const tree = {};
  const slugMap = {};

  // First pass: create all nodes
  categories.forEach(cat => {
    slugMap[cat.slug] = {
      ...cat,
      children: []
    };
  });

  // Second pass: build tree
  categories.forEach(cat => {
    if (cat.parent_slug === null) {
      tree[cat.slug] = slugMap[cat.slug];
    } else if (slugMap[cat.parent_slug]) {
      slugMap[cat.parent_slug].children.push(slugMap[cat.slug]);
    }
  });

  // Sort children by display_order
  function sortChildren(node) {
    node.children.sort((a, b) => a.display_order - b.display_order);
    node.children.forEach(sortChildren);
  }

  Object.values(tree).forEach(sortChildren);

  return { tree, slugMap };
}

// Generate tree diagram recursively
function generateTreeDiagram(node, topicCounts, competencyCounts, indent = '', isLast = true) {
  const topicCount = topicCounts[node.slug] || 0;
  const compCount = competencyCounts[node.slug] || 0;

  const prefix = indent + (isLast ? '└── ' : '├── ');
  const counts = `[${topicCount} topics, ${compCount} competencies]`;

  let result = `${prefix}${node.name} ${counts}\n`;

  const newIndent = indent + (isLast ? '    ' : '│   ');

  node.children.forEach((child, index) => {
    const childIsLast = index === node.children.length - 1;
    result += generateTreeDiagram(child, topicCounts, competencyCounts, newIndent, childIsLast);
  });

  return result;
}

// Calculate totals recursively
function calculateTotals(node, topicCounts, competencyCounts) {
  let topicTotal = topicCounts[node.slug] || 0;
  let compTotal = competencyCounts[node.slug] || 0;

  node.children.forEach(child => {
    const childTotals = calculateTotals(child, topicCounts, competencyCounts);
    topicTotal += childTotals.topics;
    compTotal += childTotals.competencies;
  });

  return { topics: topicTotal, competencies: compTotal };
}

function main() {
  console.log('Loading data...\n');

  const categories = loadAllCategories();
  const topics = loadAllTopics();
  const competencies = loadAllCompetencies();

  console.log(`Total categories: ${categories.length}`);
  console.log(`Total topics: ${topics.length}`);
  console.log(`Total competencies: ${competencies.length}\n`);

  const topicCounts = countTopicsByCategory(topics);
  const competencyCounts = countCompetenciesByCategory(competencies);
  const { tree, slugMap } = buildCategoryTree(categories);

  // Generate tree diagram to file
  let treeMd = `# Topic Coverage Tree\n\n`;
  treeMd += `**Generated:** ${new Date().toISOString()}\n`;
  treeMd += `**Total Topics:** ${topics.length}\n`;
  treeMd += `**Total Competencies:** ${competencies.length}\n`;
  treeMd += `**Total Categories:** ${categories.length}\n\n`;
  treeMd += `This file shows the category hierarchy with topic and competency counts.\n`;
  treeMd += `Run \`npm run topic:coverage\` to update.\n\n`;
  treeMd += `---\n\n`;
  treeMd += `## Category Tree\n\n`;
  treeMd += `\`\`\`\n`;

  const topLevelSlugs = Object.keys(tree).sort((a, b) => {
    return tree[a].display_order - tree[b].display_order;
  });

  topLevelSlugs.forEach((slug, index) => {
    const isLast = index === topLevelSlugs.length - 1;
    treeMd += generateTreeDiagram(tree[slug], topicCounts, competencyCounts, '', isLast);
  });

  treeMd += `\`\`\`\n\n`;

  // Add category details
  treeMd += `---\n\n`;
  treeMd += `## Category Details\n\n`;

  const allCategories = Object.values(slugMap).sort((a, b) => a.name.localeCompare(b.name));

  allCategories.forEach(cat => {
    const topicCount = topicCounts[cat.slug] || 0;
    const compCount = competencyCounts[cat.slug] || 0;

    if (topicCount > 0 || compCount > 0) {
      treeMd += `### ${cat.name}\n`;
      treeMd += `- **Slug:** \`${cat.slug}\`\n`;
      treeMd += `- **Topics:** ${topicCount}\n`;
      treeMd += `- **Competencies:** ${compCount}\n`;
      if (cat.parent_slug) {
        treeMd += `- **Parent:** ${cat.parent_slug}\n`;
      }
      treeMd += `\n`;
    }
  });

  fs.writeFileSync(TREE_OUTPUT, treeMd, 'utf8');
  console.log(`✓ Tree diagram saved to: ${TREE_OUTPUT}\n`);

  // Console output: Top-level category statistics
  console.log('='.repeat(70));
  console.log('TOP-LEVEL CATEGORY COVERAGE');
  console.log('='.repeat(70));
  console.log();

  topLevelSlugs.forEach(slug => {
    const node = tree[slug];
    const totals = calculateTotals(node, topicCounts, competencyCounts);

    console.log(`${node.name}`);
    console.log(`  Topics: ${totals.topics}`);
    console.log(`  Competencies: ${totals.competencies}`);
    console.log();
  });

  // Categories with most topics
  console.log('='.repeat(70));
  console.log('CATEGORIES WITH MOST TOPICS');
  console.log('='.repeat(70));
  console.log();

  const categoriesWithTopics = Object.entries(topicCounts)
    .map(([slug, count]) => ({
      slug,
      name: slugMap[slug]?.name || slug,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  categoriesWithTopics.forEach((cat, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${cat.name.padEnd(40)} ${cat.count} topics`);
  });

  // Categories with no topics
  console.log();
  console.log('='.repeat(70));
  console.log('CATEGORIES WITH NO TOPICS YET');
  console.log('='.repeat(70));
  console.log();

  const categoriesWithoutTopics = categories
    .filter(cat => !topicCounts[cat.slug])
    .filter(cat => competencyCounts[cat.slug] > 0) // Only show if has competencies
    .sort((a, b) => (competencyCounts[b.slug] || 0) - (competencyCounts[a.slug] || 0));

  if (categoriesWithoutTopics.length === 0) {
    console.log('✅ All categories with competencies have at least one topic!');
  } else {
    console.log(`Found ${categoriesWithoutTopics.length} categories with competencies but no topics:\n`);

    categoriesWithoutTopics.forEach(cat => {
      const compCount = competencyCounts[cat.slug] || 0;
      console.log(`- ${cat.slug.padEnd(40)} (${compCount} competencies)`);
      console.log(`  ${cat.name}`);
    });
  }

  console.log();
  console.log('💡 See full category tree in: data/seeds/TOPIC_COVERAGE_TREE.md');
  console.log();
}

main();
