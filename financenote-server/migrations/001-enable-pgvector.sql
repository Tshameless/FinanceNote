CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(1536)
  USING CASE
    WHEN embedding IS NULL THEN NULL
    ELSE embedding::text::vector
  END;

CREATE INDEX IF NOT EXISTS document_chunks_doc_page_idx
  ON document_chunks ("docId", "pageNumber");

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;
