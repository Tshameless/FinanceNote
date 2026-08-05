<template>
  <div class="ai-drawer-container">
    <div class="ai-drawer-header">
      <div class="header-title">
        <el-icon class="sparkle-icon"><Opportunity /></el-icon>
        <span>AI 财报/图书研读助手 (RAG)</span>
      </div>
      <el-tag size="small" type="success" effect="dark">DeepSeek-R1 驱动</el-tag>
    </div>

    <!-- 问答消息历史区域 -->
    <div class="ai-chat-messages" ref="messageListRef">
      <div class="welcome-card fn-glass-card">
        <h4>👋 您好！我是您的 AI 研读 Copilot</h4>
        <p>您可以问我关于当前财报的任何问题，例如：</p>
        <ul>
          <li @click="quickAsk('该公司经营活动现金流量净额是多少？变动主要原因？')">
            💡 “该公司经营活动现金流量净额是多少？变动主要原因？”
          </li>
          <li @click="quickAsk('管理层讨论与分析(MD&A)中提到了哪些主要业务风险？')">
            💡 “管理层讨论与分析(MD&A)中提到了哪些主要业务风险？”
          </li>
          <li @click="quickAsk('总结一下财报中的关键会计估计变更。')">
            💡 “总结一下财报中的关键会计估计变更。”
          </li>
        </ul>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['chat-bubble', msg.role]"
      >
        <div class="avatar">
          <span v-if="msg.role === 'user'">👤</span>
          <span v-else>🤖</span>
        </div>
        <div class="content">
          <!-- 检索到的引用出处卡片卡片组 -->
          <div v-if="msg.sources && msg.sources.length > 0" class="sources-badge-group">
            <span class="source-label">📖 检索到财报引用出处:</span>
            <el-tag
              v-for="(src, sIdx) in msg.sources"
              :key="sIdx"
              size="small"
              class="source-tag"
              type="warning"
              effect="plain"
              @click="handleJumpToPage(src.pageNumber)"
            >
              [第 {{ src.pageNumber }} 页出处]
            </el-tag>
          </div>

          <!-- AI 打字机增量回答内容 -->
          <div class="text-markdown">{{ msg.text }}</div>
        </div>
      </div>

      <div v-if="loading" class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="text">AI 正在深度检索向量数据库并推演...</span>
      </div>
    </div>

    <!-- 底部输入框 -->
    <div class="ai-input-box">
      <el-input
        v-model="inputText"
        placeholder="向 AI 提问该财报/书籍的内容 (自动带页码出处)..."
        :disabled="loading"
        @keyup.enter="handleSend"
      >
        <template #append>
          <el-button :loading="loading" type="primary" @click="handleSend">
            <el-icon><Promotion /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AI 研读 Copilot 抽屉组件 (AiDrawer.vue)
 * 
 * 核心功能：
 * 1. 发起基于 Fetch 的 SSE 流式打字机问答，安全传输 Authorization Bearer JWT Token
 * 2. 接收后端推送的包含 [pageNumber] 的 sources 数组
 * 3. 点击引用出处卡片触发 `onJumpToPage(pageNumber)` 事件，命令 PDF 阅读器实时跳转！
 */

import { ref, nextTick } from 'vue';
import { Opportunity, Promotion } from '@element-plus/icons-vue';
import { streamAiAnswerFetch, SourceInfo } from '../api/ai';

const props = defineProps<{
  docId: string;
}>();

const emit = defineEmits<{
  (e: 'onJumpToPage', pageNumber: number): void;
}>();

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: SourceInfo[];
}

const messages = ref<Message[]>([]);
const inputText = ref<string>('');
const loading = ref<boolean>(false);
const messageListRef = ref<HTMLDivElement | null>(null);

function handleSend() {
  if (!inputText.value.trim() || !props.docId || loading.value) return;

  const userQuery = inputText.value.trim();
  messages.value.push({ role: 'user', text: userQuery });
  inputText.value = '';

  const assistantMsgIndex = messages.value.length;
  messages.value.push({ role: 'assistant', text: '', sources: [] });

  loading.value = true;
  scrollToBottom();

  streamAiAnswerFetch(
    props.docId,
    userQuery,
    (sources) => {
      messages.value[assistantMsgIndex].sources = sources;
    },
    (chunk) => {
      messages.value[assistantMsgIndex].text += chunk;
      scrollToBottom();
    },
    () => {
      loading.value = false;
    },
    (err) => {
      messages.value[assistantMsgIndex].text += `\n[系统提示: ${err || 'AI 服务响应超时'}]`;
      loading.value = false;
    }
  );
}

function quickAsk(prompt: string) {
  inputText.value = prompt;
  handleSend();
}

function handleJumpToPage(pageNum: number) {
  emit('onJumpToPage', pageNum);
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
.ai-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e293b;
  border-left: 1px solid #334155;
}

.ai-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #0f172a;
  border-bottom: 1px solid #334155;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #f8fafc;
}

.sparkle-icon {
  color: #f59e0b;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card {
  padding: 16px;
  margin-bottom: 8px;
}

.welcome-card h4 {
  color: #6366f1;
  margin-bottom: 8px;
}

.welcome-card ul {
  list-style: none;
  margin-top: 8px;
}

.welcome-card li {
  font-size: 13px;
  color: #94a3b8;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.welcome-card li:hover {
  background-color: #334155;
  color: #f8fafc;
}

.chat-bubble {
  display: flex;
  gap: 10px;
}

.chat-bubble.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  max-width: 85%;
  background: #334155;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: #f8fafc;
}

.chat-bubble.user .content {
  background: #4f46e5;
}

.sources-badge-group {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.source-label {
  font-size: 12px;
  color: #f59e0b;
}

.source-tag {
  cursor: pointer;
}

.source-tag:hover {
  transform: scale(1.05);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
  animation: blink 1.4s infinite ease-in-out both;
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

.ai-input-box {
  padding: 12px 16px;
  background-color: #0f172a;
  border-top: 1px solid #334155;
}
</style>
