const mysql = require('mysql2/promise');

async function fixCharset() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    console.log('🔧 调整数据库与字符集为 utf8mb4 (支持中文字符和特殊标点)...');

    await connection.query('ALTER DATABASE financenote CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;');

    const tables = ['documents', 'document_chunks', 'notes', 'annotations', 'users'];

    for (const table of tables) {
      await connection.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`  └─ 表 ${table} 字符集已升级为 utf8mb4`);
    }

    console.log('✅ 数据库字符集调整完成！');
    await connection.end();
  } catch (err) {
    console.error('❌ 调整字符集出错:', err.message);
  }
}

fixCharset();
