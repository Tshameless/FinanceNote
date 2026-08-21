-- 生产加固：收紧文档默认可见性，并为文档检索、处理状态和用户笔记查询补充索引。
-- 脚本可重复执行；其中可见性更新会将现有文档切换为私有。
ALTER TABLE documents
  ALTER COLUMN "isPublic" SET DEFAULT FALSE;

UPDATE documents
SET "isPublic" = FALSE
WHERE "isPublic" IS DISTINCT FROM FALSE;
CREATE INDEX IF NOT EXISTS documents_created_at_idx
  ON documents ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS documents_type_created_at_idx
  ON documents ("docType", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS notes_user_doc_updated_at_idx
  ON notes ("userId", "docId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS annotations_user_doc_page_idx
  ON annotations ("userId", "docId", "pageNum", "createdAt");

CREATE INDEX IF NOT EXISTS documents_processing_status_idx
  ON documents (status) WHERE status IN ('PROCESSING', 'FAILED');

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "docId" VARCHAR(36) REFERENCES documents(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  sources JSON,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_user_doc_updated_idx
  ON conversations ("userId", "docId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS conversation_messages_conversation_created_idx
  ON conversation_messages ("conversationId", "createdAt");
