/**
 * Backfill embeddings for topics and/or competencies
 *
 * Usage:
 *   npx tsx scripts/backfill-topic-embeddings.ts [--type=topics|competencies|all]
 *
 * Examples:
 *   npm run embeddings:backfill                    # Default: topics only
 *   npm run embeddings:backfill -- --type=topics
 *   npm run embeddings:backfill -- --type=competencies
 *   npm run embeddings:backfill -- --type=all
 *
 * Environment variables required:
 *   - OPENAI_API_KEY: OpenAI API key for embeddings
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 *   - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 */

// Load environment variables before imports
// Next.js does this automatically for API routes, but scripts need explicit loading
import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { createClient } from "@supabase/supabase-js";
import {
  generateEmbeddingBatch,
  buildTopicSearchText,
} from "../libs/embeddings";

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required");
  process.exit(1);
}

// Initialize Supabase service client (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Batch size for OpenAI API (max 2048, but we'll use smaller batches)
const BATCH_SIZE = 50;

type BackfillType = 'topics' | 'competencies' | 'all';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface Competency {
  id: string;
  name: string;
  description: string | null;
  synonyms?: { synonym: string }[];
}

/**
 * Fetch all topics that need embeddings
 */
async function fetchTopicsNeedingEmbeddings(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, description")
    .is("embedding", null)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch all competencies that need embeddings
 */
async function fetchCompetenciesNeedingEmbeddings(): Promise<Competency[]> {
  const { data, error } = await supabase
    .from("competencies")
    .select(`
      id,
      name,
      description,
      competency_synonyms (
        synonym
      )
    `)
    .is("embedding", null)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch competencies: ${error.message}`);
  }

  return (data || []).map((comp: any) => ({
    id: comp.id,
    name: comp.name,
    description: comp.description,
    synonyms: comp.competency_synonyms || [],
  }));
}

/**
 * Update topics with their embeddings
 */
async function updateTopicEmbeddings(
  updates: { id: string; embedding: number[] }[]
): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from("topics")
      .update({ embedding: update.embedding })
      .eq("id", update.id);

    if (error) {
      console.error(`❌ Failed to update topic ${update.id}:`, error.message);
    }
  }
}

/**
 * Update competencies with their embeddings
 */
async function updateCompetencyEmbeddings(
  updates: { id: string; embedding: number[] }[]
): Promise<void> {
  for (const update of updates) {
    const { error } = await supabase
      .from("competencies")
      .update({ embedding: update.embedding })
      .eq("id", update.id);

    if (error) {
      console.error(`❌ Failed to update competency ${update.id}:`, error.message);
    }
  }
}

/**
 * Build searchable text for a competency (combines name + description + synonyms)
 */
function buildCompetencySearchText(competency: Competency): string {
  const parts = [competency.name];

  if (competency.description) {
    parts.push(competency.description);
  }

  if (competency.synonyms && competency.synonyms.length > 0) {
    const synonymText = competency.synonyms.map(s => s.synonym).join(', ');
    parts.push(`Synonyms: ${synonymText}`);
  }

  return parts.join('\n\n');
}

/**
 * Backfill topics
 */
async function backfillTopics() {
  console.log("📚 Processing topics...\n");

  // Fetch topics
  console.log("📥 Fetching topics without embeddings...");
  const topics = await fetchTopicsNeedingEmbeddings();
  console.log(`✅ Found ${topics.length} topics to process\n`);

  if (topics.length === 0) {
    console.log("✨ All topics already have embeddings!");
    return;
  }

  // Process in batches
  const totalBatches = Math.ceil(topics.length / BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < topics.length; i += BATCH_SIZE) {
    const batch = topics.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    console.log(
      `🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} topics)...`
    );

    try {
      // Build search texts for batch
      const searchTexts = batch.map((topic) =>
        buildTopicSearchText(topic.name, topic.description)
      );

      // Generate embeddings for batch
      console.log(`   Generating embeddings...`);
      const embeddings = await generateEmbeddingBatch(searchTexts);

      // Prepare updates
      const updates = batch.map((topic, index) => ({
        id: topic.id,
        embedding: embeddings[index],
      }));

      // Update database
      console.log(`   Updating database...`);
      await updateTopicEmbeddings(updates);

      processed += batch.length;
      console.log(
        `   ✅ Batch complete (${processed}/${topics.length} total)\n`
      );

      // Rate limiting: wait 1 second between batches
      if (i + BATCH_SIZE < topics.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Error processing batch ${batchNumber}:`, error);
      console.error(`   Skipping batch and continuing...\n`);
    }
  }

  console.log(`\n✨ Topics backfill complete! Processed ${processed}/${topics.length} topics`);

  // Calculate cost estimate
  const avgTokensPerTopic = 50; // Conservative estimate
  const totalTokens = topics.length * avgTokensPerTopic;
  const costPer1kTokens = 0.00002;
  const estimatedCost = (totalTokens / 1000) * costPer1kTokens;
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);

  return processed;
}

/**
 * Backfill competencies
 */
async function backfillCompetencies() {
  console.log("🎯 Processing competencies...\n");

  // Fetch competencies
  console.log("📥 Fetching competencies without embeddings...");
  const competencies = await fetchCompetenciesNeedingEmbeddings();
  console.log(`✅ Found ${competencies.length} competencies to process\n`);

  if (competencies.length === 0) {
    console.log("✨ All competencies already have embeddings!");
    return 0;
  }

  // Process in batches
  const totalBatches = Math.ceil(competencies.length / BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < competencies.length; i += BATCH_SIZE) {
    const batch = competencies.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    console.log(
      `🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} competencies)...`
    );

    try {
      // Build search texts for batch
      const searchTexts = batch.map((competency) =>
        buildCompetencySearchText(competency)
      );

      // Generate embeddings for batch
      console.log(`   Generating embeddings...`);
      const embeddings = await generateEmbeddingBatch(searchTexts);

      // Prepare updates
      const updates = batch.map((competency, index) => ({
        id: competency.id,
        embedding: embeddings[index],
      }));

      // Update database
      console.log(`   Updating database...`);
      await updateCompetencyEmbeddings(updates);

      processed += batch.length;
      console.log(
        `   ✅ Batch complete (${processed}/${competencies.length} total)\n`
      );

      // Rate limiting: wait 1 second between batches
      if (i + BATCH_SIZE < competencies.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Error processing batch ${batchNumber}:`, error);
      console.error(`   Skipping batch and continuing...\n`);
    }
  }

  console.log(`\n✨ Competencies backfill complete! Processed ${processed}/${competencies.length} competencies`);

  // Calculate cost estimate
  const avgTokensPerCompetency = 75; // Higher than topics due to synonyms
  const totalTokens = competencies.length * avgTokensPerCompetency;
  const costPer1kTokens = 0.00002;
  const estimatedCost = (totalTokens / 1000) * costPer1kTokens;
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}`);

  return processed;
}

/**
 * Main backfill function
 */
async function backfillEmbeddings() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => arg.startsWith('--type='));
  const type: BackfillType = (typeArg?.split('=')[1] as BackfillType) || 'topics';

  if (!['topics', 'competencies', 'all'].includes(type)) {
    console.error('❌ Invalid type. Use: topics, competencies, or all');
    process.exit(1);
  }

  console.log("🚀 Starting embedding backfill...\n");
  console.log(`📋 Type: ${type}\n`);

  let totalProcessed = 0;

  if (type === 'topics' || type === 'all') {
    totalProcessed += await backfillTopics();
    if (type === 'all') console.log('\n' + '─'.repeat(60) + '\n');
  }

  if (type === 'competencies' || type === 'all') {
    totalProcessed += await backfillCompetencies();
  }

  console.log(`\n🎉 All done! Total processed: ${totalProcessed}`);
}

/**
 * Run the backfill
 */
backfillEmbeddings()
  .then(() => {
    console.log("\n👋 Finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
