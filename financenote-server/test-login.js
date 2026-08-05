async function testLogin() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ddc',
        password: 'iwillberichmansoon001',
      }),
    });
    const json = await res.json();
    console.log('✅ LOGIN DDC TEST RESULT:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('❌ Login Error:', err.message);
  }
}

testLogin();
