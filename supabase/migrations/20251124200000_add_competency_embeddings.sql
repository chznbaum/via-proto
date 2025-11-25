-- Migration: Add embedding column to competencies for semantic search
-- Purpose: Enable hybrid semantic + keyword search for competencies
-- Date: 2025-11-24

-- Add embedding column to competencies table (1536 dimensions for text-embedding-3-small)
ALTER TABLE public.competencies
ADD COLUMN embedding vector(1536);

-- Create index for fast vector similarity search using cosine distance
CREATE INDEX idx_competencies_embedding_hnsw
ON public.competencies USING hnsw(embedding vector_cosine_ops);

-- Add comment explaining the embedding
COMMENT ON COLUMN public.competencies.embedding IS
'Semantic embedding vector (1536-dim) for competency name + description + synonyms, generated via OpenAI text-embedding-3-small';
