async function testLogin() {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  if (!username || !password) {
    throw new Error('请通过 TEST_USERNAME 和 TEST_PASSWORD 提供测试账号');
  }
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const json = await res.json();
    console.log('✅ LOGIN DDC TEST RESULT:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('❌ Login Error:', err.message);
  }
}

testLogin();
