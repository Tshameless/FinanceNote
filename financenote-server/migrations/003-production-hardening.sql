-- 生产加固：为共享文档检索、处理状态和用户笔记查询补充索引。
-- 脚本可重复执行，不改变现有数据。
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
