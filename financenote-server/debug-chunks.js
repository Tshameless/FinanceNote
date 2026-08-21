const mysql = require('mysql2/promise');

async function debugChunks() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: process.env.DB_PASSWORD,
      database: 'financenote',
    });

    const [docs] = await connection.query(`SELECT id, title FROM documents WHERE title LIKE '%富爸爸%' OR title LIKE '%投资最重要的事%' LIMIT 2`);

    for (const doc of docs) {
      console.log(`\n================== 文档: "${doc.title}" (ID: ${doc.id}) ==================`);
      const [chunks] = await connection.query(
        `SELECT id, pageNumber, LEFT(content, 100) as snippet FROM document_chunks WHERE docId = ? ORDER BY pageNumber ASC LIMIT 10`,
        [doc.id]
      );
      
      chunks.forEach((c) => {
        console.log(`[页码: ${c.pageNumber}] 片段: "${c.snippet.replace(/\n/g, ' ')}"`);
      });
    }

    await connection.end();
  } catch (err) {
    console.error(err);
  }
}

debugChunks();
