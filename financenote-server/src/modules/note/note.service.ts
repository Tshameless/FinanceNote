/**
 * 笔记与高亮划线服务实现 (NoteService)
 * 
 * 包含：
 * 1. 笔记 CRUD
 * 2. 高亮划线坐标存取 (Annotations)
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoteEntity } from './entities/note.entity';
import { AnnotationEntity } from './entities/annotation.entity';
import { CreateNoteDto, CreateAnnotationDto, UpdateNoteDto } from './dto/create-note.dto';
import { DocumentEntity } from '../document/entities/document.entity';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(NoteEntity)
    private noteRepository: Repository<NoteEntity>,
    @InjectRepository(AnnotationEntity)
    private annotationRepository: Repository<AnnotationEntity>,
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>,
  ) {}

  /**
   * 创建新笔记
   */
  async createNote(userId: number, dto: CreateNoteDto): Promise<NoteEntity> {
    if (dto.docId) {
      await this.assertDocumentExists(dto.docId);
    }
    const note = this.noteRepository.create({
      userId,
      title: dto.title,
      content: dto.content || '',
      docId: dto.docId,
      tags: dto.tags || [],
    });
    return this.noteRepository.save(note);
  }

  /**
   * 获取指定用户的笔记列表
   */
  async getUserNotes(userId: number, docId?: string): Promise<NoteEntity[]> {
    const query = this.noteRepository.createQueryBuilder('note')
      .where('note.userId = :userId', { userId });

    if (docId) {
      query.andWhere('note.docId = :docId', { docId });
    }

    return query.orderBy('note.updatedAt', 'DESC').getMany();
  }

  /**
   * 获取单个笔记详情 (带高亮标注)
   */
  async getNoteDetail(id: string, userId: number): Promise<NoteEntity> {
    const note = await this.noteRepository.findOne({
      where: { id },
      relations: ['annotations'],
    });

    if (!note) {
      throw new NotFoundException(`ID 为 ${id} 的笔记不存在`);
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('警告：您无权查看他人的私有笔记！');
    }

    return note;
  }

  /**
   * 更新笔记
   */
  async updateNote(id: string, userId: number, dto: UpdateNoteDto): Promise<NoteEntity> {
    const note = await this.getNoteDetail(id, userId);
    if (dto.title !== undefined) note.title = dto.title;
    if (dto.content !== undefined) note.content = dto.content;
    if (dto.tags !== undefined) note.tags = dto.tags;
    return this.noteRepository.save(note);
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string, userId: number): Promise<void> {
    const note = await this.getNoteDetail(id, userId);
    await this.noteRepository.remove(note);
  }

  // ================= 划线标注 (Annotations) 方法 =================

  /**
   * 保存 PDF 原文选框与高亮
   */
  async createAnnotation(userId: number, dto: CreateAnnotationDto): Promise<AnnotationEntity> {
    await this.assertDocumentExists(dto.docId);
    if (dto.noteId) {
      const note = await this.noteRepository.findOne({ where: { id: dto.noteId } });
      if (!note || note.userId !== userId) {
        throw new ForbiddenException('批注关联的笔记不存在或不属于当前用户');
      }
    }
    if (dto.pageNum < 1) {
      throw new ForbiddenException('页码必须从 1 开始');
    }
    const { x, y, width, height } = dto.rectCoords;
    if (![x, y, width, height].every((value) => typeof value === 'number' && Number.isFinite(value))) {
      throw new BadRequestException('批注坐标必须是有限数字');
    }
    if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1) {
      throw new BadRequestException('批注坐标必须位于页面范围内');
    }
    const annotation = this.annotationRepository.create({
      userId,
      docId: dto.docId,
      noteId: dto.noteId,
      pageNum: dto.pageNum,
      rectCoords: dto.rectCoords,
      selectedText: dto.selectedText,
      color: dto.color || '#ffeb3b',
      comment: dto.comment,
    });
    return this.annotationRepository.save(annotation);
  }

  /**
   * 按文档 ID 获取所有高亮划线
   */
  async getDocumentAnnotations(docId: string, userId: number): Promise<AnnotationEntity[]> {
    return this.annotationRepository.find({
      where: { docId, userId },
      order: { pageNum: 'ASC', createdAt: 'ASC' },
    });
  }

  private async assertDocumentExists(docId: string): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id: docId } });
    if (!document) {
      throw new NotFoundException(`ID 为 ${docId} 的文档不存在`);
    }
  }
}
