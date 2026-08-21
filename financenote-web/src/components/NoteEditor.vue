<template>
  <div class="note-editor-container">
    <div class="editor-header">
      <el-input
        v-model="title"
        placeholder="请输入笔记标题..."
        class="title-input"
        @change="autoSave"
      />
      <el-button type="primary" size="small" :loading="saving" @click="saveNote">
        <el-icon><DocumentAdd /></el-icon> 保存笔记
      </el-button>
    </div>

    <!-- 高亮选选区域卡片区 -->
    <div v-if="annotations.length > 0" class="annotations-bar">
      <div class="bar-title">📌 本文档下的财报划线锚点:</div>
      <div class="annotation-cards">
        <div
          v-for="anno in annotations"
          :key="anno.id"
          class="anno-card"
          @click="insertAnnotationToNote(anno)"
        >
          <span class="page-badge">[P{{ anno.pageNum }}]</span>
          <span class="text-quote">"{{ anno.selectedText }}"</span>
          <span class="click-hint">+ 嵌入笔记</span>
        </div>
      </div>
    </div>

    <!-- Markdown 简易富文本编辑器区 -->
    <div class="editor-body">
      <el-input
        v-model="content"
        type="textarea"
        :rows="18"
        placeholder="写下您的财报与书籍研读心得 (支持 Markdown 语法与嵌入财务公式)..."
        class="markdown-textarea"
        @input="onContentInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 块级研读笔记编辑器 (NoteEditor.vue)
 * 
 * 功能：
 * 1. Markdown 正文实时编写与防抖自动保存
 * 2. 显示当前文档中的【财报划线高亮卡片】，点击可一键嵌入 Markdown 正文成为财报锚点引用！
 */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { DocumentAdd } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { createNoteApi, updateNoteApi, getNotesApi, getDocumentAnnotationsApi, AnnotationItem } from '../api/note';

const props = defineProps<{
  docId?: string;
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
}>();

const title = ref<string>(props.initialTitle || '新建研读笔记');
const content = ref<string>(props.initialContent || '');
const persistedNoteId = ref<string>(props.noteId || '');
const saving = ref<boolean>(false);
const annotations = ref<AnnotationItem[]>([]);
let saveAgain = false;

let timer: any = null;

onMounted(async () => {
  if (props.docId) {
    await loadExistingNote();
    loadAnnotations();
  }
});

watch(() => props.docId, () => {
  persistedNoteId.value = props.noteId || '';
  title.value = props.initialTitle || '新建研读笔记';
  content.value = props.initialContent || '';
  if (props.docId) {
    void loadExistingNote();
    loadAnnotations();
  }
});

watch(() => props.noteId, (id) => {
  persistedNoteId.value = id || '';
});

async function loadAnnotations() {
  if (!props.docId) return;
  try {
    annotations.value = await getDocumentAnnotationsApi(props.docId);
  } catch (e) {
    console.error(e);
    ElMessage.warning('高亮批注加载失败，请稍后重试');
  }
}

function onContentInput() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void autoSave().catch(() => undefined);
  }, 2000);
}

async function autoSave() {
  if (!title.value.trim()) return;
  if (saving.value) {
    saveAgain = true;
    return;
  }

  saving.value = true;
  try {
    if (persistedNoteId.value) {
      await updateNoteApi(persistedNoteId.value, { title: title.value, content: content.value });
    } else {
      const savedNote = await createNoteApi({ title: title.value, content: content.value, docId: props.docId });
      // 后续自动保存必须更新同一条笔记，避免每次输入都创建新记录。
      persistedNoteId.value = savedNote.id;
    }
  } catch (error) {
    console.error('笔记保存失败:', error);
    ElMessage.error('笔记保存失败，请稍后重试');
    throw error;
  } finally {
    saving.value = false;
    if (saveAgain) {
      saveAgain = false;
      void autoSave().catch(() => undefined);
    }
  }
}

async function loadExistingNote() {
  if (!props.docId || persistedNoteId.value) return;
  try {
    const existingNotes = await getNotesApi(props.docId);
    const existingNote = existingNotes[0];
    if (existingNote) {
      persistedNoteId.value = existingNote.id;
      title.value = existingNote.title;
      content.value = existingNote.content;
    }
  } catch (error) {
    console.error(error);
    ElMessage.warning('笔记加载失败，请稍后重试');
  }
}

async function saveNote() {
  try {
    await autoSave();
    ElMessage.success('笔记保存成功！');
  } catch {
    // autoSave 已提示失败原因。
  }
}

function insertAnnotationToNote(anno: AnnotationItem) {
  const quoteSnippet = `\n\n> 📄 **财报原文引述 [第 ${anno.pageNum} 页]**:\n> "${anno.selectedText}"\n\n`;
  content.value += quoteSnippet;
  void autoSave().catch(() => undefined);
  ElMessage.success('已插入财报原文锚点引用！');
}

defineExpose({
  loadAnnotations,
});

onBeforeUnmount(() => {
  clearTimeout(timer);
});
</script>

<style scoped>
.note-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e293b;
  border-left: 1px solid #334155;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #0f172a;
  border-bottom: 1px solid #334155;
  gap: 12px;
}

.title-input :deep(.el-input__wrapper) {
  background-color: transparent !important;
  box-shadow: none !important;
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}

.annotations-bar {
  padding: 8px 16px;
  background-color: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid #334155;
}

.bar-title {
  font-size: 12px;
  color: #f59e0b;
  margin-bottom: 6px;
}

.annotation-cards {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.anno-card {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #334155;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #f8fafc;
  transition: background 0.2s;
}

.anno-card:hover {
  background: #475569;
}

.page-badge {
  color: #06b6d4;
  font-weight: 600;
}

.text-quote {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #cbd5e1;
}

.click-hint {
  color: #10b981;
  font-size: 10px;
}

.editor-body {
  flex: 1;
  padding: 16px;
}

.markdown-textarea :deep(.el-textarea__inner) {
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-color: #334155 !important;
  font-family: var(--fn-font-sans);
  font-size: 14px;
  line-height: 1.6;
}
</style>
