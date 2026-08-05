const mysql = require('mysql2/promise');

async function createTables() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    console.log('🏗️ 手动创建全套与 TypeORM 兼容的 utf8mb4 表结构...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        email VARCHAR(128) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) NULL,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        docType VARCHAR(32) DEFAULT 'FINANCIAL_REPORT',
        fileFormat VARCHAR(16) DEFAULT 'PDF',
        filePath VARCHAR(512) NOT NULL,
        fileSize BIGINT NOT NULL,
        stockCode VARCHAR(32) NULL,
        companyName VARCHAR(128) NULL,
        reportYear INT NULL,
        reportQuarter VARCHAR(16) NULL,
        author VARCHAR(128) NULL,
        status VARCHAR(32) DEFAULT 'PROCESSING',
        isPublic TINYINT DEFAULT 0,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id VARCHAR(36) PRIMARY KEY,
        docId VARCHAR(36) NOT NULL,
        pageNumber INT NOT NULL,
        content LONGTEXT NOT NULL,
        metadata JSON NULL,
        embedding JSON NULL,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY,
        userId INT NOT NULL,
        docId VARCHAR(36) NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NULL,
        tags TEXT NULL,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS annotations (
        id VARCHAR(36) PRIMARY KEY,
        userId INT NOT NULL,
        docId VARCHAR(36) NOT NULL,
        noteId VARCHAR(36) NULL,
        pageNum INT NOT NULL,
        rectCoords JSON NOT NULL,
        selectedText TEXT NOT NULL,
        color VARCHAR(16) DEFAULT '#ffeb3b',
        comment TEXT NULL,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ 所有表结构 (utf8mb4) 初始化完成！');
    await connection.end();
  } catch (err) {
    console.error('❌ 表可创建失败:', err.message);
  }
}

createTables();
