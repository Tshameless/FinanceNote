import request from './request';

export interface DocumentItem {
  id: string;
  ownerId: number;
  title: string;
  docType: 'FINANCIAL_REPORT' | 'BOOK';
  fileFormat: 'PDF' | 'EPUB';
  fileSize: number;
  stockCode?: string;
  companyName?: string;
  reportYear?: number;
  reportQuarter?: string;
  author?: string;
  status: 'PROCESSING' | 'PROCESSED' | 'FAILED';
  processingProgress?: number;
  processingAttempts?: number;
  processingError?: string;
  isPublic: boolean;
  createdAt: string;
}

export function getDocumentsApi(docType?: string, search?: string) {
  return request.get<DocumentItem[]>('/documents', {
    params: { docType, search },
  }) as unknown as Promise<DocumentItem[]>;
}

export function uploadDocumentApi(formData: FormData) {
  return request.post<DocumentItem>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as unknown as Promise<DocumentItem>;
}

export function deleteDocumentApi(id: string) {
  return request.delete(`/documents/${id}`);
}

export function updateDocumentVisibilityApi(id: string, isPublic: boolean) {
  return request.patch<DocumentItem>(`/documents/${id}/visibility`, { isPublic }) as unknown as Promise<DocumentItem>;
}

export function retryDocumentApi(id: string) {
  return request.post<DocumentItem>(`/documents/${id}/retry`) as unknown as Promise<DocumentItem>;
}

export function cancelDocumentProcessingApi(id: string) {
  return request.post<DocumentItem>(`/documents/${id}/cancel-processing`) as unknown as Promise<DocumentItem>;
}

export interface EpubChapter { pageNumber: number; title: string; content: string }
export function getEpubChaptersApi(id: string) {
  return request.get<{ documentId: string; title: string; chapters: EpubChapter[] }>(`/documents/${id}/epub`) as unknown as Promise<{ documentId: string; title: string; chapters: EpubChapter[] }>;
}
