ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS "processingAttempts" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "processingProgress" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "processingError" text;
