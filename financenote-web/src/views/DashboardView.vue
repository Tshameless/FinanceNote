<template>
  <div class="dashboard-layout">
    <!-- 侧边栏 Sidebar -->
    <aside class="sidebar">
      <div class="logo-area">
        <h2 class="fn-gradient-title">FinanceNote</h2>
      </div>

      <nav class="nav-menu">
        <div
          :class="['menu-item', activeTab === 'all' ? 'active' : '']"
          @click="changeTab('all')"
        >
          <el-icon><Collection /></el-icon> 全部文档资源
        </div>
        <div
          :class="['menu-item', activeTab === 'FINANCIAL_REPORT' ? 'active' : '']"
          @click="changeTab('FINANCIAL_REPORT')"
        >
          <el-icon><TrendCharts /></el-icon> 公司财报中心
        </div>
        <div
          :class="['menu-item', activeTab === 'BOOK' ? 'active' : '']"
          @click="changeTab('BOOK')"
        >
          <el-icon><Notebook /></el-icon> 深度书籍中心
        </div>
        <div
          :class="['menu-item', activeTab === 'ECONOMICS' ? 'active' : '']"
          @click="changeTab('ECONOMICS')"
        >
          <el-icon><Reading /></el-icon> 经济学智库
        </div>
      </nav>

      <div class="user-panel">
        <div class="user-info">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="username">{{ authStore.user?.username || '已登录用户' }}</span>
        </div>
        <el-button size="small" type="danger" text @click="handleLogout">
          <el-icon><SwitchButton /></el-icon> 退出
        </el-button>
      </div>
    </aside>

    <!-- 主工作区 Area -->
    <main class="main-workspace">
      <!-- 顶部 Header 搜索与上传按钮 -->
      <header class="top-header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索公司名称 / 股票代码 / 书籍标题..."
            clearable
            style="width: 320px"
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="header-right">
          <el-button type="primary" @click="showUploadDialog = true">
            <el-icon><Upload /></el-icon> 上传财报 / 图书
          </el-button>
        </div>
      </header>

      <!-- 双栏核心研读界面 -->
      <div class="content-body">
        <!-- 经济学智库全景视图 -->
        <EconomicsKnowledge
          v-if="!docStore.activeDocument && activeTab === 'ECONOMICS'"
          @ask-ai-prompt="handleAskEconomicsAi"
        />

        <!-- 未选中文档时显示文档列表 -->
        <div v-else-if="!docStore.activeDocument" class="document-grid-container">
          <h3 class="section-title">我的研读资料库</h3>
          <div v-if="docStore.loading" class="loading-box">
            <el-icon class="is-loading"><Loading /></el-icon> 正在加载资源...
          </div>
          <div v-else-if="docStore.documents.length === 0" class="empty-box">
            <p>📁 暂无财报或图书，点击右上角“上传财报/图书”即可开启 AI 研读！</p>
          </div>
          <div v-else class="doc-cards-grid">
            <div
              v-for="doc in docStore.documents"
              :key="doc.id"
              class="doc-card fn-glass-card"
              @click="openDocument(doc)"
            >
              <div class="doc-card-header">
                <el-tag size="small" :type="doc.docType === 'FINANCIAL_REPORT' ? 'primary' : 'success'">
                  {{ doc.docType === 'FINANCIAL_REPORT' ? '财报' : '书籍' }}
                </el-tag>
                <span class="file-format">{{ doc.fileFormat }}</span>
              </div>
              <h4 class="doc-title">{{ doc.title }}</h4>
              <div class="doc-meta">
                <span v-if="doc.companyName">🏢 {{ doc.companyName }} ({{ doc.stockCode }})</span>
                <span v-if="doc.reportYear">📅 {{ doc.reportYear }} {{ doc.reportQuarter }}</span>
                <span v-if="doc.author">✍️ {{ doc.author }}</span>
              </div>
              <div class="doc-card-footer">
                <span :class="['status-badge', doc.status.toLowerCase()]">
                  {{ doc.status === 'PROCESSED' ? '🟢 AI 向量已就绪' : '🟡 解析切块中' }}
                </span>
                <el-button size="small" type="danger" text @click.stop="handleDeleteDoc(doc.id)">删除</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 选中文档后：工作台 split 分栏 (左侧受保护 PDF 阅读器 | 中间 AI Copilot | 右侧 Markdown 笔记) -->
        <div v-else class="workbench-split-pane">
          <div class="workbench-bar">
            <el-button size="small" @click="closeDocument">
              <el-icon><Back /></el-icon> 返回列表
            </el-button>
            <span class="current-doc-title">正在研读: {{ docStore.activeDocument.title }}</span>
            <div class="tool-toggles">
              <el-radio-group v-model="rightPanel" size="small">
                <el-radio-button label="ai">🤖 AI 研读助手</el-radio-button>
                <el-radio-button label="note">📝 Markdown 笔记</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="split-content">
            <!-- 左侧：受保护的流式 PDF 阅读器 (支持划线选区与跳转高亮) -->
            <div class="pdf-pane">
              <PdfViewer
                ref="pdfViewerRef"
                :doc-id="docStore.activeDocument.id"
                @on-add-annotation="handleAddAnnotation"
              />
            </div>

            <!-- 右侧：AI 研读 Copilot 抽屉 或 Markdown 笔记编辑器 -->
            <div class="side-pane">
              <AiDrawer
                v-if="rightPanel === 'ai'"
                :doc-id="docStore.activeDocument.id"
                :current-page="pdfViewerRef?.currentPage || 1"
                @on-jump-to-page="handleAiJumpToPage"
              />
              <NoteEditor
                v-else
                ref="noteEditorRef"
                :doc-id="docStore.activeDocument.id"
                :initial-title="`${docStore.activeDocument.title} 的研读笔记`"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 上传文档模态框 Dialog -->
    <el-dialog v-model="showUploadDialog" title="上传财报 PDF 或 EPUB 书籍" width="540px">
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="文档类型">
          <el-radio-group v-model="uploadForm.docType">
            <el-radio label="FINANCIAL_REPORT">公司财报 (PDF)</el-radio>
            <el-radio label="BOOK">深度书籍 (EPUB/PDF)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="文档标题">
          <el-input v-model="uploadForm.title" placeholder="如：贵州茅台 2024 年报 / 聪明的投资者" />
        </el-form-item>

        <template v-if="uploadForm.docType === 'FINANCIAL_REPORT'">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="公司名称">
                <el-input v-model="uploadForm.companyName" placeholder="如：贵州茅台" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="股票代码">
                <el-input v-model="uploadForm.stockCode" placeholder="如：600519.SH" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="选择文件 (.pdf / .epub)">
          <input type="file" accept=".pdf,.epub" @change="onFileChange" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">开始上传并处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard 研读控制台视图 (DashboardView.vue)
 * 
 * 包含：
 * 1. 左侧资源菜单 (全部 / 财报 / 书籍)
 * 2. 资料卡片流与文件上传框
 * 3. 嵌入式的“受保护 PDF 阅读器 + AI Copilot (RAG) + 划线笔记双栏编辑器”
 */

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Collection, TrendCharts, Notebook, Reading, SwitchButton, Search, Upload, Loading, Back } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/authStore';
import { useDocumentStore } from '../stores/documentStore';
import { uploadDocumentApi, deleteDocumentApi, DocumentItem } from '../api/document';
import { createAnnotationApi } from '../api/note';
import PdfViewer from '../components/PdfViewer.vue';
import AiDrawer from '../components/AiDrawer.vue';
import NoteEditor from '../components/NoteEditor.vue';
import EconomicsKnowledge from '../components/EconomicsKnowledge.vue';

const router = useRouter();
const authStore = useAuthStore();
const docStore = useDocumentStore();

const activeTab = ref<string>('all');
const searchKeyword = ref<string>('');
const rightPanel = ref<'ai' | 'note'>('ai');

const showUploadDialog = ref<boolean>(false);
const uploading = ref<boolean>(false);
const selectedFile = ref<File | null>(null);

const pdfViewerRef = ref<any>(null);
const noteEditorRef = ref<any>(null);

const uploadForm = ref({
  title: '',
  docType: 'FINANCIAL_REPORT',
  companyName: '',
  stockCode: '',
  reportYear: 2025,
});

onMounted(() => {
  authStore.fetchProfile();
  docStore.fetchDocuments();
});

function changeTab(tab: string) {
  activeTab.value = tab;
  if (tab !== 'ECONOMICS') {
    docStore.fetchDocuments(tab === 'all' ? undefined : tab, searchKeyword.value);
  }
}

function handleAskEconomicsAi(promptText: string) {
  if (docStore.documents && docStore.documents.length > 0) {
    // 自动打开第一份文档并开启 AI 面板
    if (!docStore.activeDocument) {
      docStore.setActiveDocument(docStore.documents[0]);
    }
    rightPanel.value = 'ai';
    ElMessage.success('已为您打开 AI Copilot 助手，您可以直接向 AI 发送该理论在当前文档中的分析提问！');
  } else {
    ElMessage.info('提示：您可以先上传或选择一份财报/书籍，AI 助手将结合文档原文出处为您深度解答该理论的应用！');
  }
}

function handleSearch() {
  docStore.fetchDocuments(activeTab.value === 'all' ? undefined : activeTab.value, searchKeyword.value);
}

function openDocument(doc: DocumentItem) {
  docStore.setActiveDocument(doc);
}

function closeDocument() {
  docStore.setActiveDocument(null);
}

async function handleDeleteDoc(id: string) {
  try {
    await deleteDocumentApi(id);
    ElMessage.success('文档删除成功！');
    docStore.fetchDocuments();
  } catch (e) {}
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择一个 PDF 或 EPUB 文件！');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('title', uploadForm.value.title || selectedFile.value.name);
  formData.append('docType', uploadForm.value.docType);
  formData.append('fileFormat', selectedFile.value.name.endsWith('.epub') ? 'EPUB' : 'PDF');
  if (uploadForm.value.companyName) formData.append('companyName', uploadForm.value.companyName);
  if (uploadForm.value.stockCode) formData.append('stockCode', uploadForm.value.stockCode);

  uploading.value = true;
  try {
    await uploadDocumentApi(formData);
    ElMessage.success('文件上传成功，正在后台异步解析切块！');
    showUploadDialog.value = false;
    docStore.fetchDocuments();
  } finally {
    uploading.value = false;
  }
}

// 当在 AI 列表中点击 [第 42 页] 出处时，触发 PDF 阅读器跳转
function handleAiJumpToPage(pageNum: number) {
  if (pdfViewerRef.value) {
    pdfViewerRef.value.jumpToPage(pageNum);
  }
}

// 当在 PDF 中选中文字点击“高亮锚点”时
async function handleAddAnnotation(data: { pageNum: number; text: string }) {
  if (!docStore.activeDocument) return;
  try {
    await createAnnotationApi({
      docId: docStore.activeDocument.id,
      pageNum: data.pageNum,
      selectedText: data.text,
      rectCoords: { x: 0.1, y: 0.2, width: 0.8, height: 0.05 },
    });
    if (noteEditorRef.value) {
      noteEditorRef.value.loadAnnotations();
    }
  } catch (e) {}
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #0f172a;
}

.sidebar {
  width: 240px;
  background-color: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
}

.logo-area {
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.nav-menu {
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--fn-radius-sm);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover, .menu-item.active {
  background-color: #334155;
  color: #f8fafc;
}

.menu-item.active {
  font-weight: 600;
  border-left: 3px solid #6366f1;
}

.user-panel {
  padding: 16px;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f8fafc;
  font-size: 13px;
}

.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  height: 60px;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.content-body {
  flex: 1;
  overflow: hidden;
}

.document-grid-container {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.section-title {
  font-size: 18px;
  color: #f8fafc;
  margin-bottom: 16px;
}

.doc-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.doc-card {
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.doc-card:hover {
  transform: translateY(-4px);
  border-color: #6366f1;
}

.doc-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.file-format {
  font-size: 11px;
  color: #94a3b8;
}

.doc-title {
  color: #f8fafc;
  font-size: 15px;
  margin-bottom: 8px;
}

.doc-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.doc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  border-top: 1px dashed #334155;
  padding-top: 8px;
}

.status-badge {
  color: #10b981;
}

/* 分栏研读工作台 */
.workbench-split-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workbench-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: #0f172a;
  border-bottom: 1px solid #334155;
  color: #f8fafc;
}

.current-doc-title {
  font-weight: 600;
  font-size: 14px;
}

.split-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.pdf-pane {
  flex: 6;
  height: 100%;
}

.side-pane {
  flex: 4;
  height: 100%;
}

.empty-box, .loading-box {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}
</style>
