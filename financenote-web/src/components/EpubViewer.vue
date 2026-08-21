<template>
  <div class="epub-viewer">
    <aside class="chapter-list">
      <div class="chapter-heading">章节目录</div>
      <button v-for="chapter in chapters" :key="chapter.pageNumber" :class="['chapter-item', { active: chapter.pageNumber === activePage }]" @click="activePage = chapter.pageNumber">{{ chapter.title }}</button>
      <div v-if="loading" class="chapter-empty">正在加载 EPUB 内容...</div>
      <div v-else-if="!chapters.length" class="chapter-empty">文档尚未解析出章节内容</div>
    </aside>
    <article v-if="activeChapter" class="chapter-content">
      <div class="chapter-toolbar">第 {{ activeChapter.pageNumber }} 章 · {{ activeChapter.title }}</div>
      <div class="chapter-text">{{ activeChapter.content }}</div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getEpubChaptersApi, EpubChapter } from '../api/document';

const props = defineProps<{ docId: string }>();
const chapters = ref<EpubChapter[]>([]);
const activePage = ref(1);
const loading = ref(false);
const activeChapter = computed(() => chapters.value.find((chapter) => chapter.pageNumber === activePage.value) || chapters.value[0]);

async function load() {
  if (!props.docId) return;
  loading.value = true;
  try {
    const result = await getEpubChaptersApi(props.docId);
    chapters.value = result.chapters;
    activePage.value = chapters.value[0]?.pageNumber || 1;
  } catch {
    ElMessage.error('无法读取 EPUB 章节内容');
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => props.docId, load);
</script>

<style scoped>
.epub-viewer { display: flex; height: 100%; min-height: 0; background: #0f172a; color: #e2e8f0; }
.chapter-list { width: 250px; flex: 0 0 250px; overflow-y: auto; padding: 14px 10px; border-right: 1px solid #334155; background: #1e293b; }
.chapter-heading { padding: 8px 10px 14px; color: #f8fafc; font-weight: 600; }
.chapter-item { display: block; width: 100%; padding: 9px 10px; border: 0; border-radius: 4px; background: transparent; color: #cbd5e1; text-align: left; cursor: pointer; }
.chapter-item:hover, .chapter-item.active { background: #334155; color: #a5b4fc; }
.chapter-empty { padding: 14px 10px; color: #94a3b8; font-size: 13px; }
.chapter-content { flex: 1; min-width: 0; overflow-y: auto; padding: 28px 5vw; }
.chapter-toolbar { margin-bottom: 22px; color: #a5b4fc; font-size: 14px; }
.chapter-text { max-width: 900px; margin: 0 auto; white-space: pre-wrap; line-height: 1.9; font-size: 16px; }
</style>
