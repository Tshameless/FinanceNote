<template>
  <div class="ai-drawer-container">
    <div class="ai-drawer-header">
      <div class="header-title">
        <el-icon class="sparkle-icon"><Opportunity /></el-icon>
        <span>AI 财报/图书研读助手 (RAG)</span>
      </div>
      <el-tag size="small" type="success" effect="dark">商汤 SenseNova 驱动</el-tag>
    </div>

    <!-- 问答消息历史区域 -->
    <div class="ai-chat-messages" ref="messageListRef">
      <div class="welcome-card fn-glass-card">
        <h4>👋 您好！我是您的 AI 研读 Copilot</h4>
        <p>您可以问我关于当前财报或书籍的任何问题，例如：</p>
        <ul>
          <li @click="quickAsk('请总结一下本书/本财报的核心观点与主要论点？')">
            💡 “请总结一下本书/本财报的核心观点与主要论点？”
          </li>
          <li @click="quickAsk('该公司经营活动现金流量净额是多少？变动主要原因？')">
            💡 “该公司经营活动现金流量净额是多少？变动主要原因？”
          </li>
          <li @click="quickAsk('书中有哪些关于资产配置和风险防范的关键建议？')">
            💡 “书中有哪些关于资产配置和风险防范的关键建议？”
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
          <!-- 1. 顶部显示的引用源出处页码卡片 -->
          <div v-if="msg.sources && msg.sources.length > 0" class="sources-badge-group">
            <span class="source-label">📖 检索到的原文出处页码:</span>
            <el-tag
              v-for="(src, sIdx) in msg.sources"
              :key="sIdx"
              size="small"
              class="source-tag"
              type="warning"
              effect="dark"
              @click="handleJumpToPage(src.pageNumber)"
            >
              📄 第 {{ src.pageNumber }} 页
            </el-tag>
          </div>

          <!-- 2. AI 打字机增量回答内容 -->
          <div class="text-markdown" v-html="formatAiText(msg.text)"></div>

          <!-- 3. 从 AI 文本中提取的所有页码可点击跳转标签 -->
          <div v-if="msg.role === 'assistant' && extractPageNumbers(msg.text).length > 0" class="inline-page-citations">
            <span class="cite-label">🎯 正文提到的定位页码:</span>
            <el-tag
              v-for="pNum in extractPageNumbers(msg.text)"
              :key="pNum"
              size="small"
              type="primary"
              effect="plain"
              class="cite-tag"
              @click="handleJumpToPage(pNum)"
            >
              👉 跳转第 {{ pNum }} 页
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="loading" class="typing-indicator">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="text">AI 正在结合页码上下文深度推演...</span>
      </div>
    </div>

    <!-- 底部输入框 -->
    <div class="ai-input-box">
      <el-input
        v-model="inputText"
        placeholder="向 AI 提问该财报/书籍的内容 (回答自动带 [第 X 页] 出处)..."
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
 * 改进点：
 * 1. 自动从 AI 的推演文本中正则匹配形如 [第 42 页] 或 [P42] 的出处
 * 2. 渲染为高亮的“👉 跳转第 42 页”交互按钮
 * 3. 点击即可立刻控制 PDF 阅读器平滑滚动跳页定位！
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

/**
 * 正则提取文本中出现的所有 [第 X 页] 页码
 */
function extractPageNumbers(text: string): number[] {
  if (!text) return [];
  const regex = /\[(?:第\s*)?(\d+)\s*页\]|\[P(\d+)\]/g;
  const pageNums = new Set<number>();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const p = parseInt(match[1] || match[2], 10);
    if (!isNaN(p) && p > 0) {
      pageNums.add(p);
    }
  }
  return Array.from(pageNums);
}

function formatAiText(text: string): string {
  if (!text) return '';
  // 简单换行与格式化
  return text.replace(/\n/g, '<br/>');
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
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #f8fafc;
  line-height: 1.6;
}

.chat-bubble.user .content {
  background: #4f46e5;
}

.sources-badge-group {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.source-label, .cite-label {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 600;
}

.source-tag, .cite-tag {
  cursor: pointer;
  transition: transform 0.2s;
}

.source-tag:hover, .cite-tag:hover {
  transform: scale(1.08);
}

.inline-page-citations {
  margin-top: 10px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
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
