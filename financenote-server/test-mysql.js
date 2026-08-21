const mysql = require('mysql2/promise');

async function testMysql() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: process.env.DB_PASSWORD,
    });
    console.log('✅ SUCCESS! Connected to MySQL on localhost:3306!');
    await connection.query('CREATE DATABASE IF NOT EXISTS financenote;');
    console.log('✅ Database `financenote` created or already exists!');
    await connection.end();
  } catch (err) {
    console.log('❌ MySQL connection error:', err.message);
  }
}

testMysql();
