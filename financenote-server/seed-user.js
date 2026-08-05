const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedUser() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    const username = 'ddc';
    const rawPassword = 'iwillberichmansoon001';

    // 生成 bcrypt 加密密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 检查 ddc 用户是否存在
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      await connection.query(
        'INSERT INTO users (username, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
        [username, 'ddc@financenote.com', passwordHash]
      );
      console.log(`✅ 成功添加新用户 [${username} / ${rawPassword}] 到数据库！`);
    } else {
      await connection.query(
        'UPDATE users SET passwordHash = ? WHERE username = ?',
        [passwordHash, username]
      );
      console.log(`✅ 用户 [${username}] 的密码已更新为 [${rawPassword}]！`);
    }

    await connection.end();
  } catch (err) {
    console.error('❌ 更新账号失败:', err.message);
  }
}

seedUser();
