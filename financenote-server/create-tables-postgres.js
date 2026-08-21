/**
 * PostgreSQL 初始化脚本。
 * 生产环境建议使用 migrations；此脚本用于本地首次启动和 CI 数据库准备。
 */
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'financenote',
});

async function createTables() {
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    let embeddingColumn = 'embedding JSON';
    if (process.env.PGVECTOR_ENABLED !== 'false') {
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        embeddingColumn = 'embedding vector(1536)';
      } catch (error) {
        if (process.env.PGVECTOR_REQUIRED === 'true') throw error;
        console.warn('pgvector 不可用，将使用 JSON embedding 列并回退关键词检索。');
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        email VARCHAR(128) NOT NULL UNIQUE,
        "passwordHash" VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        "docType" VARCHAR(32) NOT NULL DEFAULT 'FINANCIAL_REPORT',
        "fileFormat" VARCHAR(16) NOT NULL DEFAULT 'PDF',
        "filePath" VARCHAR(512) NOT NULL,
        "fileSize" BIGINT NOT NULL,
        "stockCode" VARCHAR(32),
        "companyName" VARCHAR(128),
        "reportYear" INTEGER,
        "reportQuarter" VARCHAR(16),
        author VARCHAR(128),
        status VARCHAR(32) NOT NULL DEFAULT 'PROCESSING',
        "processingAttempts" INTEGER NOT NULL DEFAULT 0,
        "processingProgress" INTEGER NOT NULL DEFAULT 0,
        "processingError" TEXT,
        "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "docId" VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        "pageNumber" INTEGER NOT NULL,
        content TEXT NOT NULL,
        metadata JSON,
         ${embeddingColumn},
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "docId" VARCHAR(36) REFERENCES documents(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        tags TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS annotations (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "docId" VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        "noteId" VARCHAR(36) REFERENCES notes(id) ON DELETE SET NULL,
        "pageNum" INTEGER NOT NULL,
        "rectCoords" JSON NOT NULL,
        "selectedText" TEXT NOT NULL,
        color VARCHAR(16) NOT NULL DEFAULT '#ffeb3b',
        comment TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

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

      CREATE INDEX IF NOT EXISTS document_chunks_doc_page_idx
        ON document_chunks ("docId", "pageNumber");
      CREATE INDEX IF NOT EXISTS conversations_user_doc_updated_idx
        ON conversations ("userId", "docId", "updatedAt" DESC);
      CREATE INDEX IF NOT EXISTS conversation_messages_conversation_created_idx
        ON conversation_messages ("conversationId", "createdAt");
    `);

    await client.query('COMMIT');
    console.log('PostgreSQL tables and pgvector extension are ready.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

createTables().catch((error) => {
  console.error(`Database initialization failed: ${error.message}`);
  process.exitCode = 1;
});
