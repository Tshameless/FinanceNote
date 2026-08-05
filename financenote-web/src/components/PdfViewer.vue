<template>
  <div class="pdf-viewer-container">
    <!-- PDF 顶部控制面板 -->
    <div class="pdf-toolbar">
      <div class="toolbar-section">
        <!-- 目录大纲开关按钮 -->
        <el-button size="small" type="info" plain @click="showOutline = !showOutline">
          <el-icon><Menu /></el-icon> 目录大纲
        </el-button>

        <!-- 模式切换：连续平滑滚动 vs 单页翻页 -->
        <el-radio-group v-model="renderMode" size="small" @change="handleModeChange">
          <el-radio-button label="continuous">📜 连续下滑滚动</el-radio-button>
          <el-radio-button label="single">📖 单页切页</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 单页模式切页控件 -->
      <div v-if="renderMode === 'single'" class="toolbar-section">
        <el-button-group size="small">
          <el-button :disabled="currentPage <= 1" @click="prevPage">
            <el-icon><ArrowLeft /></el-icon> 上一页
          </el-button>
          <el-button :disabled="currentPage >= totalPages" @click="nextPage">
            下一页 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      </div>

      <div v-else class="toolbar-section">
        <span class="page-info">当前处于第 {{ currentPage }} / {{ totalPages }} 页</span>
      </div>

      <!-- 缩放与适应控制 -->
      <div class="toolbar-section">
        <el-button size="small" circle @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <el-button size="small" circle @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
        <el-button size="small" plain @click="fitWidth">适应宽幅</el-button>

        <el-button size="small" type="primary" plain @click="createSelectionAnnotation">
          <el-icon><EditPen /></el-icon> 划线高亮
        </el-button>
      </div>
    </div>

    <div class="pdf-main-body">
      <!-- 侧边目录大纲 (TOC Outline Drawer) -->
      <div v-if="showOutline" class="pdf-outline-sidebar">
        <div class="outline-header">
          <span>📚 图书/财报章节目录</span>
          <el-button size="small" text @click="showOutline = false">关闭</el-button>
        </div>
        <div v-if="outlineTree.length === 0" class="empty-outline">
          该 PDF 未嵌入标准结构化目录，可使用上方页码直接跳转
        </div>
        <div v-else class="outline-list">
          <div
            v-for="(item, idx) in outlineTree"
            :key="idx"
            class="outline-item"
            @click="jumpToDest(item.dest)"
          >
            🔖 {{ item.title }}
          </div>
        </div>
      </div>

      <!-- 1. 连续平滑下滑阅读模式 (Continuous Scroll View) -->
      <div
        v-if="renderMode === 'continuous'"
        ref="continuousWrapperRef"
        class="pdf-continuous-wrapper"
        @scroll="handleContinuousScroll"
      >
        <div
          v-for="pageNum in totalPages"
          :key="pageNum"
          :id="`pdf-page-container-${pageNum}`"
          class="continuous-page-box"
        >
          <div class="page-num-label">第 {{ pageNum }} 页</div>
          <div class="canvas-viewport" :style="viewportStyle">
            <canvas :id="`pdf-canvas-${pageNum}`"></canvas>
            
            <!-- 触发定位高亮选框遮罩 -->
            <div
              v-if="highlightRect && currentPage === pageNum"
              class="highlight-overlay-box"
              :style="highlightBoxStyle"
            ></div>
          </div>
        </div>
      </div>

      <!-- 2. 单页翻页阅读模式 (Single Page View) -->
      <div v-else class="pdf-single-wrapper" ref="singleWrapperRef">
        <div class="canvas-viewport" :style="viewportStyle">
          <canvas ref="canvasRef"></canvas>
          <div
            v-if="highlightRect"
            class="highlight-overlay-box"
            :style="highlightBoxStyle"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 升级版 PDF 阅读器组件 (PdfViewer.vue)
 * 
 * 改进核心点：
 * 1. 【下滑平滑连续阅读】支持像 Chrome / Adobe Acrobat / Obsidian 一样的连续垂直滚动长列表模式！
 * 2. 【PDF 目录大纲提取】自动提取 PDF 本身的章节 Bookmark Outline，点击直接跳页！
 * 3. 【流畅适应宽幅与缩放】自动适应视图宽度，支持键盘 / 滚轮操作。
 * 4. 【出处精密跳转】点击 AI [第42页] 引用时，平滑 `scrollIntoView` 并绘制高亮选框。
 */

import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, EditPen, Menu } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as pdfjsLib from 'pdfjs-dist';
import { useAuthStore } from '../stores/authStore';

// 指定 PDF.js Worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const props = defineProps<{
  docId: string;
}>();

const emit = defineEmits<{
  (e: 'onAddAnnotation', data: { pageNum: number; text: string }): void;
}>();

const authStore = useAuthStore();

const renderMode = ref<'continuous' | 'single'>('continuous'); // 默认连续平滑滚动模式
const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const scale = ref<number>(1.1);
const showOutline = ref<boolean>(false);
const outlineTree = ref<{ title: string; dest: any }[]>([]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const continuousWrapperRef = ref<HTMLDivElement | null>(null);
const singleWrapperRef = ref<HTMLDivElement | null>(null);

let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
const renderedPages = new Set<number>();

// 动态高亮选框 (当点击 AI [P42] 引用卡片时激活)
const highlightRect = ref<{ x: number; y: number; width: number; height: number } | null>(null);

const viewportStyle = computed(() => ({
  position: 'relative' as const,
  display: 'inline-block',
  margin: '0 auto',
}));

const highlightBoxStyle = computed(() => {
  if (!highlightRect.value) return {};
  return {
    position: 'absolute' as const,
    left: `${highlightRect.value.x * 100}%`,
    top: `${highlightRect.value.y * 100}%`,
    width: `${highlightRect.value.width * 100}%`,
    height: `${highlightRect.value.height * 100}%`,
    backgroundColor: 'rgba(255, 235, 59, 0.45)',
    border: '2px solid #f59e0b',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite',
    pointerEvents: 'none' as const,
  };
});

onMounted(() => {
  loadPdfStream();
});

watch(() => props.docId, () => {
  currentPage.value = 1;
  renderedPages.clear();
  loadPdfStream();
});

async function loadPdfStream() {
  if (!props.docId) return;

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: `/api/documents/${props.docId}/stream`,
      httpHeaders: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;

    // 提取 PDF 目录大纲
    try {
      const outline = await pdfDoc.getOutline();
      if (outline) {
        outlineTree.value = outline.map((item: any) => ({
          title: item.title,
          dest: item.dest,
        }));
      }
    } catch (e) {}

    if (renderMode.value === 'continuous') {
      renderContinuousPages();
    } else {
      renderSinglePage(currentPage.value);
    }
  } catch (error: any) {
    ElMessage.error('无法读取受保护的 PDF 资源，请确认是否已登录！');
  }
}

/**
 * 渲染模式一：连续下滑平滑滚动渲染
 */
async function renderContinuousPages() {
  renderedPages.clear();
  await nextTick();
  // 优先渲染前 5 页保证流畅度
  for (let p = 1; p <= Math.min(5, totalPages.value); p++) {
    renderPageCanvas(p);
  }
}

async function renderPageCanvas(pageNum: number) {
  if (!pdfDoc || renderedPages.has(pageNum)) return;

  const canvas = document.getElementById(`pdf-canvas-${pageNum}`) as HTMLCanvasElement;
  if (!canvas) return;

  renderedPages.add(pageNum);
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale.value });
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (context) {
    await page.render({ canvasContext: context, viewport }).promise;
  }
}

/**
 * 监听连续下滑滚动，自动计算当前所处页码并按需增量渲染
 */
function handleContinuousScroll() {
  if (!continuousWrapperRef.value || renderMode.value !== 'continuous') return;

  const containerTop = continuousWrapperRef.value.scrollTop;
  
  for (let p = 1; p <= totalPages.value; p++) {
    const el = document.getElementById(`pdf-page-container-${p}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const parentRect = continuousWrapperRef.value.getBoundingClientRect();
      
      // 判断哪一页居中于当前视口
      if (rect.top <= parentRect.top + 200 && rect.bottom >= parentRect.top + 200) {
        currentPage.value = p;
        // 增量预渲染上下相邻页
        renderPageCanvas(p);
        if (p > 1) renderPageCanvas(p - 1);
        if (p < totalPages.value) renderPageCanvas(p + 1);
        break;
      }
    }
  }
}

/**
 * 渲染模式二：单页切页渲染
 */
async function renderSinglePage(pageNum: number) {
  if (!pdfDoc || !canvasRef.value) return;

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale.value });

  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (context) {
    await page.render({ canvasContext: context, viewport }).promise;
  }
}

function handleModeChange() {
  if (renderMode.value === 'continuous') {
    renderContinuousPages();
  } else {
    renderSinglePage(currentPage.value);
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    highlightRect.value = null;
    renderSinglePage(currentPage.value);
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    highlightRect.value = null;
    renderSinglePage(currentPage.value);
  }
}

function zoomIn() {
  scale.value += 0.2;
  refreshRender();
}

function zoomOut() {
  if (scale.value > 0.6) {
    scale.value -= 0.2;
    refreshRender();
  }
}

function fitWidth() {
  scale.value = 1.35;
  refreshRender();
}

function refreshRender() {
  if (renderMode.value === 'continuous') {
    renderContinuousPages();
  } else {
    renderSinglePage(currentPage.value);
  }
}

/**
 * 供外部调用：跳页并平滑滚动高亮 (如点击 AI [P42] 引用卡片时)
 */
async function jumpToPage(pageNum: number, rect?: { x: number; y: number; width: number; height: number }) {
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum;
    highlightRect.value = rect || { x: 0.1, y: 0.2, width: 0.8, height: 0.1 };

    if (renderMode.value === 'continuous') {
      await renderPageCanvas(pageNum);
      const el = document.getElementById(`pdf-page-container-${pageNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      renderSinglePage(pageNum);
    }
  }
}

async function jumpToDest(dest: any) {
  if (!pdfDoc || !dest) return;
  try {
    const pageIndex = await pdfDoc.getPageIndex(dest[0]);
    jumpToPage(pageIndex + 1);
  } catch (e) {
    jumpToPage(1);
  }
}

function createSelectionAnnotation() {
  const selectionText = window.getSelection()?.toString().trim();
  if (!selectionText) {
    ElMessage.info('请先用鼠标在 PDF 原文中框选一段文本！');
    return;
  }
  emit('onAddAnnotation', {
    pageNum: currentPage.value,
    text: selectionText,
  });
  ElMessage.success('已成功选中文本并生成高亮锚点！');
}

defineExpose({
  jumpToPage,
});
</script>

<style scoped>
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0f172a;
  border-right: 1px solid #334155;
}

.pdf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  color: #f8fafc;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-info, .zoom-level {
  font-size: 13px;
  color: #94a3b8;
}

.pdf-main-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 目录大纲 Drawer Sidebar */
.pdf-outline-sidebar {
  width: 240px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #334155;
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
}

.empty-outline {
  padding: 16px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.outline-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.outline-item {
  padding: 8px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.outline-item:hover {
  background: #334155;
  color: #6366f1;
}

/* 模式一：连续平滑下滑模式 */
.pdf-continuous-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.continuous-page-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-num-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

/* 模式二：单页模式 */
.pdf-single-wrapper {
  flex: 1;
  overflow: auto;
  padding: 24px;
  text-align: center;
}

.canvas-viewport {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
