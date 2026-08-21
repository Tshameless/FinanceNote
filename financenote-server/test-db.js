const { Client } = require('pg');

const password = process.env.DB_PASSWORD;
if (!password) throw new Error('请通过 DB_PASSWORD 提供测试数据库密码');

async function testPasswords() {
  {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password,
    });
    try {
      await client.connect();
      console.log('✅ 数据库连接测试成功');
      await client.end();
      return true;
    } catch (err) {
      console.error(`❌ 数据库连接失败: ${err.message}`);
    }
  }
}

testPasswords();
