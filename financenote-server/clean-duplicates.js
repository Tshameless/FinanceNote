const mysql = require('mysql2/promise');

async function cleanDuplicates() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    console.log('🧹 开始清理重复的图书记录...');

    // 查出所有重复的 title，只保留每个 title 最新保存的那一条 ID
    const [rows] = await connection.query(`
      SELECT title, MIN(createdAt) as oldTime
      FROM documents
      GROUP BY title
      HAVING COUNT(*) > 1
    `);

    for (const row of rows) {
      // 找出对应 title 除第一条之外的冗余 ID
      const [dups] = await connection.query(
        `SELECT id FROM documents WHERE title = ? ORDER BY createdAt DESC LIMIT 1`,
        [row.title]
      );
      
      const keepId = dups[0].id;

      // 删除其它同名记录及其关联切块
      const [toDelete] = await connection.query(
        `SELECT id FROM documents WHERE title = ? AND id != ?`,
        [row.title, keepId]
      );

      for (const del of toDelete) {
        await connection.query(`DELETE FROM document_chunks WHERE docId = ?`, [del.id]);
        await connection.query(`DELETE FROM documents WHERE id = ?`, [del.id]);
      }
    }

    const [finalDocs] = await connection.query(`SELECT id, title FROM documents`);
    console.log(`✅ 清理完成！当前数据库中刚好保留 ${finalDocs.length} 本唯一图书（无重复条目）。`);

    await connection.end();
  } catch (err) {
    console.error('❌ 清理失败:', err.message);
  }
}

cleanDuplicates();
