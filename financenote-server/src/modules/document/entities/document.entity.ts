/**
 * 研读文档实体定义文件 (DocumentEntity)
 * 
 * 对应数据库表：`documents`
 * 记录用户上传的财报 PDF 或电子书 (EPUB/PDF) 的元数据，
 * 包括所有者 userId、股票代码、报告年份、季度、物理保存路径与解析处理状态。
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/user.entity';
import { DocumentChunkEntity } from './chunk.entity';
import { NoteEntity } from '../../note/entities/note.entity';

export enum DocType {
  FINANCIAL_REPORT = 'FINANCIAL_REPORT', // 财报 (年报/半年报/季报/招股书)
  BOOK = 'BOOK',                          // 深度书籍 (EPUB/PDF)
}

export enum FileFormat {
  PDF = 'PDF',
  EPUB = 'EPUB',
}

export enum DocumentStatus {
  PROCESSING = 'PROCESSING', // 上传完成，后台向量解析中
  PROCESSED = 'PROCESSED',   // 解析切块与向量化已完成，就绪
  FAILED = 'FAILED',         // 解析失败
}

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '文档 UUID 唯一标识符' })
  id: string;

  @Column({ type: 'int', comment: '文档所有者 User ID' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255, comment: '文档标题' })
  title: string;

  @Column({ type: 'enum', enum: DocType, default: DocType.FINANCIAL_REPORT, comment: '文档分类' })
  docType: DocType;

  @Column({ type: 'enum', enum: FileFormat, default: FileFormat.PDF, comment: '文件格式' })
  fileFormat: FileFormat;

  @Column({ type: 'varchar', length: 512, comment: '受保护的磁盘物理保存路径 (不可直接 HTTP 访问)' })
  filePath: string;

  @Column({ type: 'bigint', comment: '字节文件大小' })
  fileSize: number;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '股票代码 (若为财报，如 600519.SH / AAPL)' })
  stockCode: string;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '公司名称 (如 贵州茅台 / 苹果)' })
  companyName: string;

  @Column({ type: 'int', nullable: true, comment: '财报年份 (如 2025)' })
  reportYear: number;

  @Column({ type: 'varchar', length: 16, nullable: true, comment: '财报季度 (如 Q1, Q2, Q3, Q4, ANNUAL)' })
  reportQuarter: string;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '书籍作者 (若为图书)' })
  author: string;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.PROCESSING, comment: '后台向量解析状态' })
  status: DocumentStatus;

  @Column({ type: 'int', default: 0, comment: '解析任务已尝试次数' })
  processingAttempts: number;

  @Column({ type: 'int', default: 0, comment: '解析进度百分比' })
  processingProgress: number;

  @Column({ type: 'text', nullable: true, comment: '最近一次解析错误' })
  processingError: string;

  @Column({ type: 'boolean', default: true, comment: '文档是否公开；当前产品策略为全部公开' })
  isPublic: boolean;

  @CreateDateColumn({ comment: '上传创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '最后修改时间' })
  updatedAt: Date;

  // 关联属性
  @OneToMany(() => DocumentChunkEntity, (chunk) => chunk.document)
  chunks: DocumentChunkEntity[];

  @OneToMany(() => NoteEntity, (note) => note.document)
  notes: NoteEntity[];
}
