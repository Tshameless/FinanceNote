/**
 * PDF 原文划线标注与坐标锚点实体定义文件 (AnnotationEntity)
 * 
 * 对应数据库表：`annotations`
 * 记录用户在阅读财报 PDF 时划选中或框选表格生成的【原文高亮与坐标锚点】。
 * 前端点击笔记里的动态引用卡片时，触发阅读器精确跳转 `pageNum` 并定位绘制 `rectCoords`。
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DocumentEntity } from '../../document/entities/document.entity';
import { NoteEntity } from './note.entity';

@Entity('annotations')
export class AnnotationEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '高亮标注 UUID' })
  id: string;

  @Column({ type: 'int', comment: '所有者 User ID' })
  userId: number;

  @Column({ type: 'uuid', comment: '关联的文档 ID' })
  docId: string;

  @ManyToOne(() => DocumentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'docId' })
  document: DocumentEntity;

  @Column({ type: 'uuid', nullable: true, comment: '关联的笔记 ID (可选)' })
  noteId: string;

  @ManyToOne(() => NoteEntity, (note) => note.annotations, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'noteId' })
  note: NoteEntity;

  @Column({ type: 'int', comment: '所在页码 (1-based)' })
  pageNum: number;

  @Column({ type: 'jsonb', comment: '划线选框相对坐标矩形 { x: number, y: number, width: number, height: number }' })
  rectCoords: Record<string, any>;

  @Column({ type: 'text', comment: '选中的财报原文或表格文本片段' })
  selectedText: string;

  @Column({ type: 'varchar', length: 16, default: '#ffeb3b', comment: '高亮显示颜色十六进制' })
  color: string;

  @Column({ type: 'text', nullable: true, comment: '随手速记批注' })
  comment: string;

  @CreateDateColumn({ comment: '高亮标注创建时间' })
  createdAt: Date;
}
