const { OpenAI } = require('openai');

async function testSenseNova() {
  const client = new OpenAI({
    apiKey: process.env.SENSENOVA_API_KEY,
    baseURL: process.env.SENSENOVA_BASE_URL || 'https://token.sensenova.cn/v1',
  });

  try {
    console.log('📡 正在测试商汤 SenseNova API 接口连接...');
    const response = await client.chat.completions.create({
      model: 'sensenova-6.7-flash-lite',
      messages: [{ role: 'user', content: '你好！请用一句话介绍你自己。' }],
    });

    console.log('✅ 商汤 SenseNova API 连接成功！');
    console.log('🤖 AI 回复内容:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ AI API 测试出错:', error.message);
  }
}

testSenseNova();
