import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getDocumentsApi, DocumentItem } from '../api/document';

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<DocumentItem[]>([]);
  const activeDocument = ref<DocumentItem | null>(null);
  const loading = ref<boolean>(false);

  async function fetchDocuments(docType?: string, search?: string) {
    loading.value = true;
    try {
      documents.value = await getDocumentsApi(docType, search);
    } finally {
      loading.value = false;
    }
  }

  function setActiveDocument(doc: DocumentItem | null) {
    activeDocument.value = doc;
  }

  return {
    documents,
    activeDocument,
    loading,
    fetchDocuments,
    setActiveDocument,
  };
});
