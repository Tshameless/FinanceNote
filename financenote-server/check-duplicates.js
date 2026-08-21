const mysql = require('mysql2/promise');

async function checkDuplicates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: process.env.DB_PASSWORD,
      database: 'financenote',
    });

    const [rows] = await connection.query(`
      SELECT title, COUNT(*) as count, GROUP_CONCAT(id) as ids 
      FROM documents 
      GROUP BY title 
      HAVING count > 1
    `);

    console.log('📋 数据库中重复的文档条目:', JSON.stringify(rows, null, 2));

    const [allDocs] = await connection.query(`SELECT id, title, docType, fileFormat FROM documents;`);
    console.log(`📚 当前数据库中一共有 ${allDocs.length} 条文档记录。`);

    await connection.end();
  } catch (err) {
    console.error('❌ 查询出错:', err.message);
  }
}

checkDuplicates();
