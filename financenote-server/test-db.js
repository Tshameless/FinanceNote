const { Client } = require('pg');

const passwords = ['', 'postgres', '123456', 'root', 'admin', 'password', '12345678', 'Laplace'];

async function testPasswords() {
  for (const pwd of passwords) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pwd,
    });
    try {
      await client.connect();
      console.log(`✅ SUCCESS_PASSWORD: "${pwd}"`);
      await client.end();
      return pwd;
    } catch (err) {
      console.log(`❌ Password "${pwd}" failed: ${err.message}`);
    }
  }
}

testPasswords();
