const mysql = require('mysql2/promise');

async function testAiStreamPost() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'financenote',
    });

    // 获取包含有切块的任意一个文档 ID
    const [docRows] = await connection.query('SELECT id, title FROM documents LIMIT 1');
    await connection.end();

    if (docRows.length === 0) {
      console.log('⚠️ 暂无文档，请先在系统上传或导入文档');
      return;
    }

    const docId = docRows[0].id;
    console.log(`📡 测试文档 "${docRows[0].title}" (ID: ${docId}) 的 POST SSE 流式研读...`);

    // 登录获取 accessToken
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ddc', password: 'iwillberichmansoon001' }),
    });

    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;

    const streamRes = await fetch('http://localhost:3000/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        docId,
        query: '请总结这本书的核心观点',
        topK: 3,
      }),
    });

    console.log(`HTTP Status: ${streamRes.status} ${streamRes.statusText}`);

    if (streamRes.status === 200) {
      console.log('✅ POST /api/ai/stream 响应 200 流模式正常！');
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          console.log('Received Chunk:', decoder.decode(value));
        }
      }
    } else {
      console.error('❌ 流测试失败:', streamRes.status);
    }
  } catch (err) {
    console.error('❌ 测试异常:', err.message);
  }
}

testAiStreamPost();
