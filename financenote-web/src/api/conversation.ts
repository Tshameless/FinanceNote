import request from './request';

export interface ConversationItem {
  id: string;
  docId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id?: string; pageNumber: number; snippet?: string }>;
  createdAt: string;
}

export function getConversationsApi(docId?: string) {
  return request.get<ConversationItem[]>('/conversations', { params: { docId } }) as unknown as Promise<ConversationItem[]>;
}

export function getConversationMessagesApi(id: string) {
  return request.get<ConversationMessage[]>(`/conversations/${id}/messages`) as unknown as Promise<ConversationMessage[]>;
}
