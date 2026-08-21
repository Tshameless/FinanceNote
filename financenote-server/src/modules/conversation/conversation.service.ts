import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationMessageEntity, MessageRole } from './entities/message.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity) private conversations: Repository<ConversationEntity>,
    @InjectRepository(ConversationMessageEntity) private messages: Repository<ConversationMessageEntity>,
  ) {}

  async getOrCreate(userId: number, conversationId?: string, docId?: string, title = '新的研读会话') {
    if (conversationId) {
      const existing = await this.conversations.findOne({ where: { id: conversationId, userId } });
      if (!existing) throw new NotFoundException('会话不存在或不属于当前用户');
      return existing;
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
