const mysql = require('mysql2/promise');

async function deleteAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: process.env.DB_PASSWORD,
      database: 'financenote',
    });

    const [result] = await connection.query('DELETE FROM users WHERE username = ?', ['admin']);
    console.log(`✅ 已成功从数据库中彻底删除 admin 账号 (影响行数: ${result.affectedRows})！`);

    await connection.end();
  } catch (err) {
    console.error('❌ 删除 admin 账号失败:', err.message);
  }
}

deleteAdmin();
