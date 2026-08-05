/**
 * 文本向量切块实体定义文件 (DocumentChunkEntity)
 * 
 * 对应数据库表：`document_chunks`
 * 存储将长篇财报 PDF 或图书切割后的段落切块，
 * 关键字段包括 `pageNumber`（所在页码）以及通过 `pgvector` 存储的 1536 维 embedding 向量，
 * 用于后续 AI RAG 研读问答检索出处。
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DocumentEntity } from './document.entity';

@Entity('document_chunks')
export class DocumentChunkEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '切块 Chunk UUID' })
  id: string;

  @Column({ type: 'uuid', comment: '关联的文档 ID' })
  docId: string;

  @ManyToOne(() => DocumentEntity, (doc) => doc.chunks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'docId' })
  document: DocumentEntity;

  @Column({ type: 'int', comment: '该文本片段位于 PDF/图书的页码 (1-based)' })
  pageNumber: number;

  @Column({ type: 'text', comment: '结构化切块文本内容' })
  content: string;

  @Column({ type: 'jsonb', nullable: true, comment: '额外元数据 (例如章节标题、表格矩形坐标 x,y,w,h 等)' })
  metadata: Record<string, any>;

  // pgvector 存储 1536 维向量 (OpenAI / DeepSeek / 通义千问 embedding 维度)
  // 注意：在实际 SQL 中可通过 Raw Query 进行 1 - (embedding <=> $1) 的余弦相似度计算
  @Column({ type: 'float', array: true, nullable: true, comment: '向量 Embedding 浮点数组' })
  embedding: number[];

  @CreateDateColumn({ comment: '切块时间' })
  createdAt: Date;
}
