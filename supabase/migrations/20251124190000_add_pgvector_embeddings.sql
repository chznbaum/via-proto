-- Migration: Add pgvector extension and embedding column for semantic search
-- Purpose: Enable hybrid semantic + keyword search for topics
-- Date: 2025-11-24

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to topics table (1536 dimensions for text-embedding-3-small)
ALTER TABLE public.topics
ADD COLUMN embedding vector(1536);

-- Create index for fast vector similarity search using cosine distance
-- HNSW (Hierarchical Navigable Small World) is more efficient than IVFFlat for < 1M vectors
CREATE INDEX idx_topics_embedding_hnsw
ON public.topics USING hnsw(embedding vector_cosine_ops);

-- Add comment explaining the embedding
COMMENT ON COLUMN public.topics.embedding IS
'Semantic embedding vector (1536-dim) for topic name + description, generated via OpenAI text-embedding-3-small';
