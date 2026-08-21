const mysql = require('mysql2/promise');

async function recreateDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: process.env.DB_PASSWORD,
    });

    console.log('🧹 重新创建 financenote 数据库 (默认 utf8mb4 字符集)...');

    await connection.query('DROP DATABASE IF EXISTS financenote;');
    await connection.query('CREATE DATABASE financenote CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');

    console.log('✅ 数据库 financenote (utf8mb4) 重新创建成功！');
    await connection.end();
  } catch (err) {
    console.error('❌ 重建数据库失败:', err.message);
  }
}

recreateDb();
