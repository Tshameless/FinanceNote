/**
 * 块级研读笔记实体定义文件 (NoteEntity)
 * 
 * 对应数据库表：`notes`
 * 记录用户为财报或书籍编写的 Markdown 格式笔记，可关联特定 document 或独立存在。
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/user.entity';
import { DocumentEntity } from '../../document/entities/document.entity';
import { AnnotationEntity } from './annotation.entity';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '笔记 UUID' })
  id: string;

  @Column({ type: 'int', comment: '笔记所有者 User ID' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true, comment: '关联的文档 ID (可选)' })
  docId: string;

  @ManyToOne(() => DocumentEntity, (doc) => doc.notes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'docId' })
  document: DocumentEntity;

  @Column({ type: 'varchar', length: 255, comment: '笔记标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: 'Markdown 格式的笔记正文内容' })
  content: string;

  @Column({ type: 'text', array: true, nullable: true, comment: '分类标签数组 (例如 ["财务比率", "风险警示"])' })
  tags: string[];

  @CreateDateColumn({ comment: '笔记创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '最后编辑更新时间' })
  updatedAt: Date;

  @OneToMany(() => AnnotationEntity, (annotation) => annotation.note)
  annotations: AnnotationEntity[];
}
