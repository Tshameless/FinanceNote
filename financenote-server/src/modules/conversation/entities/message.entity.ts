import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MessageRole { USER = 'user', ASSISTANT = 'assistant' }

@Entity('conversation_messages')
export class ConversationMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  sources: Array<{ id?: string; pageNumber: number; snippet?: string }>;

  @CreateDateColumn()
  createdAt: Date;
}
