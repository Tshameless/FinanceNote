const { OpenAI } = require('openai');

async function testDeepSeek() {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  });

  try {
    console.log('📡 正在测试 DeepSeek API 接口连接...');
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL_NAME || 'deepseek-chat',
      messages: [{ role: 'user', content: '你好！请用一句话介绍你自己。' }],
    });

    console.log('✅ DeepSeek API 连接成功！');
    console.log('🤖 AI 回复内容:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ AI API 测试出错:', error.message);
  }
}

testDeepSeek();
