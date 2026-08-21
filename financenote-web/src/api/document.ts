import request from './request';

export interface DocumentItem {
  id: string;
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
