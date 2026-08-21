import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationMessageEntity, MessageRole } from './entities/message.entity';
import { DocumentEntity } from '../document/entities/document.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity) private conversations: Repository<ConversationEntity>,
    @InjectRepository(ConversationMessageEntity) private messages: Repository<ConversationMessageEntity>,
    @InjectRepository(DocumentEntity) private documents: Repository<DocumentEntity>,
  ) {}

  async getOrCreate(userId: number, conversationId?: string, docId?: string, title = '新的研读会话') {
    if (conversationId) {
      const existing = await this.conversations.findOne({ where: { id: conversationId, userId } });
      if (!existing) throw new NotFoundException('会话不存在或不属于当前用户');
      if ((docId || undefined) !== (existing.docId || undefined)) {
        throw new BadRequestException('会话只能用于创建时绑定的文档');
      }
      return existing;
    }
    if (docId) {
      const document = await this.documents.findOne({ where: { id: docId } });
      if (!document) throw new NotFoundException('目标文档不存在');
      if (!document.isPublic && document.userId !== userId) {
        throw new ForbiddenException('无权为该文档创建研读会话');
      }
    }
    return this.conversations.save(this.conversations.create({ userId, docId, title }));
  }

  list(userId: number, docId?: string) {
    return this.conversations.find({ where: { userId, ...(docId ? { docId } : {}) }, order: { updatedAt: 'DESC' } });
  }

  async history(userId: number, id: string) {
    const conversation = await this.conversations.findOne({ where: { id, userId } });
    if (!conversation) throw new NotFoundException('会话不存在或不属于当前用户');
    return this.messages.find({ where: { conversationId: id }, order: { createdAt: 'ASC' } });
  }

  async addMessage(userId: number, conversationId: string, role: MessageRole, content: string, sources?: ConversationMessageEntity['sources']) {
    const conversation = await this.conversations.findOne({ where: { id: conversationId, userId } });
    if (!conversation) throw new NotFoundException('会话不存在或不属于当前用户');
    await this.messages.save(this.messages.create({ conversationId, role, content, sources }));
    await this.conversations.update(conversationId, { updatedAt: new Date() });
  }
}
