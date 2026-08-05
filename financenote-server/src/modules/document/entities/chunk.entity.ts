/**
 * 文本向量切块实体定义文件 (DocumentChunkEntity)
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DocumentEntity } from './document.entity';

@Entity('document_chunks')
export class DocumentChunkEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '切块 Chunk UUID' })
  id: string;

  @Column({ type: 'varchar', length: 36, comment: '关联的文档 ID' })
  docId: string;

  @ManyToOne(() => DocumentEntity, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'docId' })
  document: DocumentEntity;

  @Column({ type: 'int', comment: '该文本片段位于 PDF/图书的页码 (1-based)' })
  pageNumber: number;

  @Column({ type: 'text', comment: '结构化切块文本内容' })
  content: string;

  @Column({ type: 'json', nullable: true, comment: '额外元数据 (例如章节标题等)' })
  metadata: Record<string, any>;

  @Column({ type: 'json', nullable: true, comment: '向量 Embedding 浮点数组' })
  embedding: number[];

  @CreateDateColumn({ comment: '切块时间' })
  createdAt: Date;
}
