<template>
  <div class="economics-container">
    <!-- 1. 顶部 Header 与 搜索/筛选工具栏 -->
    <header class="economics-header fn-glass-card">
      <div class="header-info">
        <h2 class="fn-gradient-title">🏛️ 经济学智库与学派全景</h2>
        <p class="header-subtitle">系统梳理古典、凯恩斯、奥地利、货币主义等主流学派及微宏观核心公理，助力财报深度研读</p>
      </div>

      <div class="filter-toolbar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学派名称 / 代表人物 (如 哈耶克、凯恩斯) / 核心概念 (如 护城河、QE)..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-radio-group v-model="selectedCategory" size="medium" class="category-tabs">
          <el-radio-button label="ALL">🌐 全部智库 ({{ filteredItems.length }})</el-radio-button>
          <el-radio-button label="SCHOOL">📜 经济学派系</el-radio-button>
          <el-radio-button label="MICRO">🔍 微观经济基础</el-radio-button>
          <el-radio-button label="MACRO">📈 宏观与货币政策</el-radio-button>
          <el-radio-button label="FINANCE">🌍 金融与国际经济</el-radio-button>
        </el-radio-group>
      </div>
    </header>

    <!-- 2. 核心卡片网格布局 -->
    <div class="cards-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="eco-card fn-glass-card"
        @click="openDetail(item)"
      >
        <div class="card-top-bar">
          <el-tag
            size="small"
            :type="getTagType(item.category)"
            effect="dark"
            class="category-tag"
          >
            {{ item.categoryLabel }}
          </el-tag>
          <span class="era-span">{{ item.era }}</span>
        </div>

        <h3 class="card-title">
          {{ item.title }}
          <span class="english-title">{{ item.englishTitle }}</span>
        </h3>

        <!-- 代表人物 Tag 流 -->
        <div v-if="item.representatives && item.representatives.length > 0" class="representatives-box">
          <span class="label">代表人物：</span>
          <el-tag
            v-for="(rep, idx) in item.representatives"
            :key="idx"
            size="mini"
            type="info"
            class="rep-tag"
          >
            {{ rep }}
          </el-tag>
        </div>

        <!-- 核心思想简要列举 -->
        <div class="core-ideas-preview">
          <div v-for="(idea, i) in item.coreIdeas.slice(0, 3)" :key="i" class="idea-item">
            <span class="bullet">✦</span>
            <span class="idea-text">{{ idea }}</span>
          </div>
        </div>

        <!-- 财报与投资应用启示亮点框 -->
        <div class="app-highlight-box">
          <div class="app-title"><el-icon><DataAnalysis /></el-icon> 财报与投资启示：</div>
          <p class="app-text">{{ item.financialApplication }}</p>
        </div>

        <!-- 底部交互按钮 -->
        <div class="card-actions">
          <el-button
            size="small"
            type="primary"
            plain
            class="ask-ai-btn"
            @click.stop="handleAskAi(item)"
          >
            <el-icon><Cpu /></el-icon> 向 AI 询问应用
          </el-button>

          <el-button size="small" text type="info" class="detail-btn">
            详情 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 3. 详细内容弹窗 Dialog / 侧拉框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`🏛️ ${selectedItem?.title || ''} - 深度剖析`"
      width="680px"
      custom-class="eco-detail-dialog"
    >
      <div v-if="selectedItem" class="dialog-content">
        <div class="dialog-header-meta">
          <el-tag :type="getTagType(selectedItem.category)" size="medium">
            {{ selectedItem.categoryLabel }}
          </el-tag>
          <span class="meta-era">历史时期 / 适用场景：{{ selectedItem.era }}</span>
        </div>

        <div class="detail-section">
          <h4>👥 主要代表人物与理论奠基人</h4>
          <div class="rep-chips">
            <el-tag v-for="(rep, i) in selectedItem.representatives" :key="i" type="warning" effect="dark" class="chip">
              {{ rep }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <h4>💡 核心主张与公理推演</h4>
          <ul class="ideas-ul">
            <li v-for="(idea, idx) in selectedItem.coreIdeas" :key="idx">
              {{ idea }}
            </li>
          </ul>
        </div>

        <div class="detail-section description-box">
          <h4>📖 学派背景与历史演进</h4>
          <p>{{ selectedItem.detailedDescription }}</p>
        </div>

        <div class="detail-section application-box fn-glass-card">
          <h4>📊 财报研读与投资实操应用</h4>
          <p>{{ selectedItem.financialApplication }}</p>
        </div>

        <div v-if="selectedItem.keyQuotes && selectedItem.keyQuotes.length > 0" class="detail-section quotes-box">
          <h4>💬 名言与经典论述</h4>
          <blockquote v-for="(quote, qIdx) in selectedItem.keyQuotes" :key="qIdx">
            {{ quote }}
          </blockquote>
        </div>

        <div v-if="selectedItem.recommendedBooks && selectedItem.recommendedBooks.length > 0" class="detail-section">
          <h4>📚 推荐阅读名著</h4>
          <div class="book-tags">
            <el-tag v-for="(b, bIdx) in selectedItem.recommendedBooks" :key="bIdx" type="success" effect="dark" size="medium">
              📖 {{ b }}
            </el-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAskAi(selectedItem!)">
          🤖 让 AI Copilot 结合财报深度分析该理论
        </el-button>
      </template>
    </el-dialog>

    <!-- 4. 原地 AI Copilot 研读弹窗 (不离开当前智库页面) -->
    <el-dialog
      v-model="aiDialogVisible"
      :title="`🤖 AI 经济学研读 Copilot - ${aiTopicTitle}`"
      width="720px"
      custom-class="eco-detail-dialog"
    >
      <div class="ai-dialog-body">
        <div class="ai-prompt-box">
          <span class="prompt-label">💡 分析课题：</span>
          <p class="prompt-text">{{ aiQuery }}</p>
        </div>

        <div class="ai-stream-content">
          <div v-if="!aiAnswerText && aiLoading" class="ai-loading-placeholder">
            <el-icon class="is-loading"><Loading /></el-icon> AI 专家正在结合经济学模型与财报视角为您深度推演...
          </div>
          <div v-else class="ai-markdown-text" v-html="formatAiText(aiAnswerText)"></div>
        </div>
      </div>

      <template #footer>
        <div class="ai-dialog-footer">
          <el-input
            v-model="customFollowup"
            placeholder="追问关于该理论或财报应用的问题..."
            :disabled="aiLoading"
            style="width: 100%"
            @keyup.enter="handleSendFollowup"
          >
            <template #append>
              <el-button :loading="aiLoading" type="primary" @click="handleSendFollowup">
                <el-icon><Promotion /></el-icon> 发送追问
              </el-button>
            </template>
          </el-input>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 经济学智库组件 (EconomicsKnowledge.vue)
 * 
 * 展示各大经济学派系（古典、凯恩斯、奥地利、货币主义、行为经济学等）
 * 及微观/宏观核心理论，支持关键字搜索与原地 AI Copilot 研读对话。
 */

import { ref, computed } from 'vue';
import { Search, DataAnalysis, Cpu, ArrowRight, Loading, Promotion } from '@element-plus/icons-vue';
import { ECONOMICS_DATA, EconomicsItem } from '../data/economicsData';
import { streamAiAnswerFetch } from '../api/ai';

const emit = defineEmits<{
  (e: 'ask-ai-prompt', promptText: string): void;
}>();

const searchQuery = ref<string>('');
const selectedCategory = ref<string>('ALL');

const detailVisible = ref<boolean>(false);
const selectedItem = ref<EconomicsItem | null>(null);

// 原地 AI Copilot 弹窗状态
const aiDialogVisible = ref<boolean>(false);
const aiTopicTitle = ref<string>('');
const aiQuery = ref<string>('');
const aiAnswerText = ref<string>('');
const aiLoading = ref<boolean>(false);
const customFollowup = ref<string>('');

const filteredItems = computed(() => {
  return ECONOMICS_DATA.filter((item) => {
    if (selectedCategory.value !== 'ALL' && item.category !== selectedCategory.value) {
      return false;
    }
    if (!searchQuery.value.trim()) return true;
    const q = searchQuery.value.toLowerCase().trim();
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchEng = item.englishTitle.toLowerCase().includes(q);
    const matchReps = item.representatives.some((r) => r.toLowerCase().includes(q));
    const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
    const matchDesc = item.detailedDescription.toLowerCase().includes(q);
    return matchTitle || matchEng || matchReps || matchTags || matchDesc;
  });
});

function getTagType(category: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  switch (category) {
    case 'SCHOOL':
      return 'warning';
    case 'MICRO':
      return 'success';
    case 'MACRO':
      return 'danger';
    case 'FINANCE':
      return '';
    default:
      return 'info';
  }
}

function openDetail(item: EconomicsItem) {
  selectedItem.value = item;
  detailVisible.value = true;
}

function handleAskAi(item: EconomicsItem) {
  detailVisible.value = false;
  aiTopicTitle.value = item.title;
  const prompt = `请结合【${item.title} (${item.englishTitle})】的核心理论与公理，帮我深度分析该理论在公司财报研读、商业护城河评估及宏观投资策略中的具体应用场景和注意事项。`;
  aiQuery.value = prompt;
  aiAnswerText.value = '';
  aiDialogVisible.value = true;
  triggerAiStream(prompt);
}

function handleSendFollowup() {
  if (!customFollowup.value.trim() || aiLoading.value) return;
  const followup = customFollowup.value.trim();
  customFollowup.value = '';
  aiQuery.value = followup;
  aiAnswerText.value = '';
  triggerAiStream(followup);
}

function triggerAiStream(queryText: string) {
  aiLoading.value = true;
  streamAiAnswerFetch(
    undefined, // docId 为空，进入通用金融经济学大模型对话
    queryText,
    undefined,
    () => {},
    (chunk) => {
      aiAnswerText.value += chunk;
    },
    () => {
      aiLoading.value = false;
    },
    (err) => {
      aiAnswerText.value += `\n[系统提示: ${err || 'AI 服务响应异常'}]`;
      aiLoading.value = false;
    }
  );
}

function formatAiText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}
</script>

<style scoped>
.economics-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #0f172a;
}

/* 顶部 Header */
.economics-header {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: var(--fn-radius-lg);
}

.header-info h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.header-subtitle {
  color: #94a3b8;
  font-size: 14px;
}

.filter-toolbar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 380px;
}

.category-tabs :deep(.el-radio-button__inner) {
  background-color: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.category-tabs :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: #6366f1;
  border-color: #6366f1;
  color: #ffffff;
  box-shadow: -1px 0 0 0 #6366f1;
}

/* 核心卡片网格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.eco-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.eco-card:hover {
  transform: translateY(-4px);
  border-color: #6366f1;
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.15);
}

.card-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.era-span {
  font-size: 12px;
  color: #64748b;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.english-title {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.representatives-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.representatives-box .label {
  font-size: 12px;
  color: #94a3b8;
}

.rep-tag {
  background-color: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.core-ideas-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.idea-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.5;
}

.bullet {
  color: #6366f1;
  font-weight: bold;
}

.app-highlight-box {
  background: rgba(99, 102, 241, 0.08);
  border-left: 3px solid #6366f1;
  padding: 10px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.app-title {
  font-size: 12px;
  font-weight: 600;
  color: #818cf8;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.app-text {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.5;

  /* 最多显示两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #334155;
  padding-top: 12px;
  margin-top: 4px;
}

.ask-ai-btn {
  font-weight: 600;
}

/* 弹窗深色主题与极高对比度文本样式 */
:deep(.eco-detail-dialog) {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6) !important;
}

:deep(.eco-detail-dialog .el-dialog__header) {
  border-bottom: 1px solid #334155 !important;
  margin-right: 0 !important;
  padding: 20px 24px 16px !important;
}

:deep(.eco-detail-dialog .el-dialog__title) {
  color: #f8fafc !important;
  font-weight: 700 !important;
  font-size: 18px !important;
}

:deep(.eco-detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #94a3b8 !important;
  font-size: 18px !important;
}

:deep(.eco-detail-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #f8fafc !important;
}

:deep(.eco-detail-dialog .el-dialog__body) {
  padding: 20px 24px !important;
  color: #f1f5f9 !important;
}

:deep(.eco-detail-dialog .el-dialog__footer) {
  border-top: 1px solid #334155 !important;
  padding: 16px 24px !important;
  background-color: #0f172a !important;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #f1f5f9;
}

.dialog-header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-era {
  font-size: 13px;
  color: #cbd5e1;
  font-weight: 500;
}

.detail-section h4 {
  font-size: 15px;
  font-weight: 700;
  color: #60a5fa; /* 亮蓝色标题 */
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rep-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ideas-ul {
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #f8fafc;
  line-height: 1.6;
}

.ideas-ul li {
  color: #f8fafc;
}

.description-box p {
  font-size: 14px;
  line-height: 1.7;
  color: #e2e8f0;
  background: #0f172a;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.application-box {
  padding: 16px;
  border-left: 4px solid #10b981;
  background: rgba(16, 185, 129, 0.12);
  border-radius: 6px;
}

.application-box p {
  font-size: 14px;
  line-height: 1.7;
  color: #ecfdf5; /* 清晰高对比度明亮文本 */
}

.quotes-box blockquote {
  margin: 8px 0;
  padding: 12px 16px;
  background: #0f172a;
  border-left: 4px solid #f59e0b;
  color: #fef08a; /* 亮黄色高对比度名言引言 */
  font-style: italic;
  font-size: 14px;
  border-radius: 4px;
  line-height: 1.6;
}

.book-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

<!-- 全局非 Scope 样式：针对全局 Teleport 的 Dialog 进行像素级极高对比度暗黑样式覆写 -->
<style>
.eco-detail-dialog {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
  border-radius: 12px !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85) !important;
}

.eco-detail-dialog .el-dialog__header {
  background-color: #0f172a !important;
  border-bottom: 1px solid #334155 !important;
  padding: 20px 24px 16px !important;
  margin-right: 0 !important;
}

.eco-detail-dialog .el-dialog__title {
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 20px !important;
}

.eco-detail-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #cbd5e1 !important;
  font-size: 22px !important;
}

.eco-detail-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #ffffff !important;
}

.eco-detail-dialog .el-dialog__body {
  background-color: #1e293b !important;
  color: #ffffff !important;
  padding: 24px !important;
}

.eco-detail-dialog .el-dialog__footer {
  background-color: #0f172a !important;
  border-top: 1px solid #334155 !important;
  padding: 16px 24px !important;
}

.eco-detail-dialog .dialog-content {
  color: #ffffff !important;
}

.eco-detail-dialog .meta-era {
  color: #cbd5e1 !important;
  font-weight: 500 !important;
}

.eco-detail-dialog .detail-section h4 {
  color: #38bdf8 !important; /* 亮天蓝色高对比度标题 */
  font-size: 16px !important;
  font-weight: 700 !important;
  margin-bottom: 10px !important;
}

.eco-detail-dialog .ideas-ul li {
  color: #f8fafc !important; /* 高亮纯白列表 */
  font-size: 14px !important;
  line-height: 1.7 !important;
}

.eco-detail-dialog .description-box p {
  color: #f1f5f9 !important; /* 纯白高对比度文字 */
  background: #0f172a !important;
  padding: 16px !important;
  border-radius: 8px !important;
  border: 1px solid #334155 !important;
}

.eco-detail-dialog .application-box {
  background: rgba(16, 185, 129, 0.15) !important;
  border-left: 4px solid #10b981 !important;
  padding: 16px !important;
  border-radius: 6px !important;
}

.eco-detail-dialog .application-box p {
  color: #ecfdf5 !important; /* 亮荧白色文字 */
  font-size: 14px !important;
  line-height: 1.7 !important;
}

.eco-detail-dialog .quotes-box blockquote {
  background: #0f172a !important;
  border-left: 4px solid #f59e0b !important;
  color: #fef08a !important; /* 明亮金黄名言文字 */
  padding: 12px 16px !important;
  font-size: 14px !important;
}

.eco-detail-dialog .ai-dialog-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  max-height: 520px !important;
  overflow-y: auto !important;
}

.eco-detail-dialog .ai-prompt-box {
  background: #0f172a !important;
  border-left: 4px solid #6366f1 !important;
  padding: 12px 16px !important;
  border-radius: 6px !important;
}

.eco-detail-dialog .prompt-label {
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #818cf8 !important;
}

.eco-detail-dialog .prompt-text {
  font-size: 14px !important;
  color: #ffffff !important;
  margin-top: 4px !important;
  line-height: 1.5 !important;
}

.eco-detail-dialog .ai-stream-content {
  background: #0f172a !important;
  border: 1px solid #334155 !important;
  border-radius: 8px !important;
  padding: 16px !important;
  min-height: 200px !important;
}

.eco-detail-dialog .ai-loading-placeholder {
  color: #94a3b8 !important;
  font-size: 14px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 20px 0 !important;
}

.eco-detail-dialog .ai-markdown-text {
  color: #ffffff !important;
  font-size: 14px !important;
  line-height: 1.7 !important;
}

.eco-detail-dialog .ai-dialog-footer {
  display: flex !important;
  width: 100% !important;
}
</style>
