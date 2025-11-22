#!/usr/bin/env node

/**
 * Find competencies that have not yet been included in any topics
 *
 * Usage:
 *   node scripts/find-unused-competencies.js                    # Show all unused
 *   node scripts/find-unused-competencies.js --category=programming
 *   node scripts/find-unused-competencies.js --verbose          # Show both stats
 *
 * Flags:
 *   --category=<slug>  Filter to only show competencies from a specific category
 *   --verbose          Show both "not primary" and "not used at all" statistics
 */

const fs = require('fs');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
let categoryFilter = null;
let verbose = false;

args.forEach(arg => {
  if (arg.startsWith('--category=')) {
    categoryFilter = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  }
});

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

// Build usage maps
function buildUsageMaps(topics) {
  const usedAsPrimary = new Set();
  const usedAsNonPrimary = new Set();
  const usedAtAll = new Set();

  topics.forEach(topic => {
    if (topic.competencies) {
      topic.competencies.forEach(comp => {
        usedAtAll.add(comp.competency_slug);
        if (comp.is_primary) {
          usedAsPrimary.add(comp.competency_slug);
        } else {
          usedAsNonPrimary.add(comp.competency_slug);
        }
      });
    }
  });

  return { usedAsPrimary, usedAsNonPrimary, usedAtAll };
}

function main() {
  console.log('Loading competencies and topics...\n');

  const competencies = loadAllCompetencies();
  const topics = loadAllTopics();
  const { usedAsPrimary, usedAsNonPrimary, usedAtAll } = buildUsageMaps(topics);

  console.log(`Total competencies: ${competencies.length}`);
  console.log(`Total topics: ${topics.length}\n`);

  // Filter by category if specified
  let filteredCompetencies = competencies;
  if (categoryFilter) {
    filteredCompetencies = competencies.filter(c => c.category_slug === categoryFilter);
    console.log(`Filtering to category: ${categoryFilter}`);
    console.log(`Competencies in category: ${filteredCompetencies.length}\n`);
  }

  // Find competencies not used at all
  const notUsedAtAll = filteredCompetencies.filter(c => !usedAtAll.has(c.slug));

  // Find competencies not used as primary (but maybe used as non-primary)
  const notPrimary = filteredCompetencies.filter(c => !usedAsPrimary.has(c.slug));

  // Display results
  console.log('='.repeat(70));
  console.log('COMPETENCIES NOT USED IN ANY TOPICS');
  console.log('='.repeat(70));
  console.log();

  if (notUsedAtAll.length === 0) {
    console.log('✅ All competencies are used in at least one topic!');
  } else {
    console.log(`Found ${notUsedAtAll.length} competencies not used in any topics:\n`);

    notUsedAtAll.forEach(comp => {
      console.log(`- ${comp.slug.padEnd(40)} (${comp.category_slug})`);
      console.log(`  ${comp.name}`);
    });
  }

  if (verbose) {
    console.log();
    console.log('='.repeat(70));
    console.log('COMPETENCIES NOT PRIMARY IN ANY TOPICS');
    console.log('='.repeat(70));
    console.log();

    const notPrimaryButUsed = notPrimary.filter(c => usedAtAll.has(c.slug));

    if (notPrimary.length === 0) {
      console.log('✅ All competencies are primary in at least one topic!');
    } else {
      console.log(`Found ${notPrimary.length} competencies not primary in any topics:`);
      console.log(`  - ${notUsedAtAll.length} not used at all (see above)`);
      console.log(`  - ${notPrimaryButUsed.length} used only as supporting competencies\n`);

      if (notPrimaryButUsed.length > 0) {
        console.log('Competencies used only as supporting (non-primary):\n');
        notPrimaryButUsed.forEach(comp => {
          console.log(`- ${comp.slug.padEnd(40)} (${comp.category_slug})`);
          console.log(`  ${comp.name}`);
        });
      }
    }
  }

  // Summary statistics
  console.log();
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log();

  const totalFiltered = filteredCompetencies.length;
  const usedCount = totalFiltered - notUsedAtAll.length;
  const primaryCount = filteredCompetencies.filter(c => usedAsPrimary.has(c.slug)).length;
  const nonPrimaryOnlyCount = usedCount - primaryCount;

  console.log(`Total competencies${categoryFilter ? ` (${categoryFilter})` : ''}: ${totalFiltered}`);
  console.log(`Used in topics: ${usedCount} (${((usedCount / totalFiltered) * 100).toFixed(1)}%)`);
  console.log(`  - Primary in topics: ${primaryCount} (${((primaryCount / totalFiltered) * 100).toFixed(1)}%)`);
  console.log(`  - Non-primary only: ${nonPrimaryOnlyCount} (${((nonPrimaryOnlyCount / totalFiltered) * 100).toFixed(1)}%)`);
  console.log(`Not used at all: ${notUsedAtAll.length} (${((notUsedAtAll.length / totalFiltered) * 100).toFixed(1)}%)`);
  console.log();

  if (!verbose && notPrimary.length > notUsedAtAll.length) {
    console.log('💡 Tip: Use --verbose to also see competencies that are only used as supporting (non-primary)');
    console.log();
  }

  if (!categoryFilter) {
    console.log('💡 Tip: Use --category=<slug> to filter results to a specific category');
    console.log();
  }
}

main();
