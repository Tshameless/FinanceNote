<template>
  <div class="pdf-viewer-container">
    <!-- PDF 顶部控制面板 -->
    <div class="pdf-toolbar">
      <div class="toolbar-section">
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

      <div class="toolbar-section">
        <el-button size="small" circle @click="zoomOut"><el-icon><ZoomOut /></el-icon></el-button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <el-button size="small" circle @click="zoomIn"><el-icon><ZoomIn /></el-icon></el-button>
        <el-button size="small" type="primary" plain @click="createSelectionAnnotation">
          <el-icon><EditPen /></el-icon> 高亮并添加到笔记
        </el-button>
      </div>
    </div>

    <!-- PDF 渲染区域 (包含 Canvas + 高亮遮罩) -->
    <div class="pdf-canvas-wrapper" ref="wrapperRef">
      <div class="canvas-viewport" :style="viewportStyle">
        <canvas ref="canvasRef"></canvas>

        <!-- 原文高亮选框遮罩 (用于演示点击 AI 引用或笔记时闪烁定位) -->
        <div
          v-if="highlightRect"
          class="highlight-overlay-box"
          :style="highlightBoxStyle"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PDF 渲染与划线跳转组件 (PdfViewer.vue)
 * 
 * 核心技术：
 * 1. 使用 pdfjs-dist 进行 PDF 页面解析与 Canvas 绘制
 * 2. 传递携带 JWT Authorization 头部的 HTTP 请求，安全读取 `/api/documents/:id/stream` 受保护流
 * 3. 响应外部事件 `jumpToPage(pageNum, rect)`：自动翻页并闪烁高亮矩形选框，实现 AI 研读引用与笔记原文一键锚定
 */

import { ref, onMounted, watch, computed } from 'vue';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, EditPen } from '@element-plus/icons-vue';
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

const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const scale = ref<number>(1.2);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const wrapperRef = ref<HTMLDivElement | null>(null);
let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

// 动态高亮选框 (当点击 AI [P42] 引用卡片时激活)
const highlightRect = ref<{ x: number; y: number; width: number; height: number } | null>(null);

const viewportStyle = computed(() => ({
  position: 'relative' as const,
  display: 'inline-block',
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
  loadPdfStream();
});

/**
 * 带有 Authorization Token 标头的受保护 PDF 流式读取
 */
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
    renderPage(currentPage.value);
  } catch (error: any) {
    ElMessage.error('无法读取受保护的 PDF 资源，请确认是否已登录！');
  }
}

/**
 * 渲染指定页码 Canvas
 */
async function renderPage(pageNum: number) {
  if (!pdfDoc || !canvasRef.value) return;

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: scale.value });

  const canvas = canvasRef.value;
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (context) {
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    highlightRect.value = null;
    renderPage(currentPage.value);
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    highlightRect.value = null;
    renderPage(currentPage.value);
  }
}

function zoomIn() {
  scale.value += 0.2;
  renderPage(currentPage.value);
}

function zoomOut() {
  if (scale.value > 0.6) {
    scale.value -= 0.2;
    renderPage(currentPage.value);
  }
}

/**
 * 供外部调用：跳页并高亮 (如点击 AI [P42] 引用卡片时)
 */
function jumpToPage(pageNum: number, rect?: { x: number; y: number; width: number; height: number }) {
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum;
    renderPage(pageNum);
    if (rect) {
      highlightRect.value = rect;
    } else {
      // 默认在页面中间显示示范矩形框
      highlightRect.value = { x: 0.1, y: 0.2, width: 0.8, height: 0.1 };
    }
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
  gap: 12px;
}

.page-info, .zoom-level {
  font-size: 13px;
  color: #94a3b8;
}

.pdf-canvas-wrapper {
  flex: 1;
  overflow: auto;
  padding: 24px;
  text-align: center;
}

.canvas-viewport {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
