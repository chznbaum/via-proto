import OpenAI from "openai";

/**
 * Embedding generation utilities
 *
 * Note: While we use OpenRouter for chat completions, we use OpenAI directly
 * for embeddings since:
 * 1. OpenRouter's embedding support is limited
 * 2. OpenAI's text-embedding-3-small is industry standard and cost-effective
 * 3. Embeddings are a different use case than chat (semantic search vs generation)
 */

// Embedding model configuration
const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dimensions, $0.00002 per 1K tokens
const EMBEDDING_DIMENSIONS = 1536;

// Lazy-load OpenAI client to avoid initialization issues with env vars in scripts
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for embeddings"
      );
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate an embedding vector for a single text input
 * @param text - Text to embed (topic name, description, or search query)
 * @returns Embedding vector as number array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Generate embeddings for multiple texts in a single API call (more efficient)
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingBatch(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      encoding_format: "float",
    });

    // Sort by index to maintain input order
    return response.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch (error) {
    console.error("Error generating embedding batch:", error);
    throw new Error(`Failed to generate embedding batch: ${error}`);
  }
}

/**
 * Build searchable text for a topic (combines name + description)
 * This is what we'll embed for semantic search
 */
export function buildTopicSearchText(
  topicName: string,
  description?: string | null
): string {
  if (description) {
    return `${topicName}\n\n${description}`;
  }
  return topicName;
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns value between -1 (opposite) and 1 (identical)
 * Used for debugging/testing - PostgreSQL pgvector handles this in production
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
