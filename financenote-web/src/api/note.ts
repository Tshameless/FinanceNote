import request from './request';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  docId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationItem {
  id: string;
  docId: string;
  noteId?: string;
  pageNum: number;
  rectCoords: { x: number; y: number; width: number; height: number };
  selectedText: string;
  color?: string;
  comment?: string;
}

export function getNotesApi(docId?: string) {
  return request.get<NoteItem[]>('/notes', { params: { docId } });
}

export function createNoteApi(data: Partial<NoteItem>) {
  return request.post<NoteItem>('/notes', data);
}

export function updateNoteApi(id: string, data: Partial<NoteItem>) {
  return request.put<NoteItem>(`/notes/${id}`, data);
}

export function deleteNoteApi(id: string) {
  return request.delete(`/notes/${id}`);
}

export function createAnnotationApi(data: Partial<AnnotationItem>) {
  return request.post<AnnotationItem>('/notes/annotations', data);
}

export function getDocumentAnnotationsApi(docId: string) {
  return request.get<AnnotationItem[]>(`/notes/annotations/document/${docId}`);
}
