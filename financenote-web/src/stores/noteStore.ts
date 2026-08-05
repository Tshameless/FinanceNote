import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getNotesApi, getDocumentAnnotationsApi, NoteItem, AnnotationItem } from '../api/note';

export const useNoteStore = defineStore('note', () => {
  const notes = ref<NoteItem[]>([]);
  const currentNote = ref<NoteItem | null>(null);
  const annotations = ref<AnnotationItem[]>([]);

  async function fetchNotes(docId?: string) {
    notes.value = await getNotesApi(docId);
  }

  async function fetchAnnotations(docId: string) {
    annotations.value = await getDocumentAnnotationsApi(docId);
  }

  function setCurrentNote(note: NoteItem | null) {
    currentNote.value = note;
  }

  return {
    notes,
    currentNote,
    annotations,
    fetchNotes,
    fetchAnnotations,
    setCurrentNote,
  };
});
