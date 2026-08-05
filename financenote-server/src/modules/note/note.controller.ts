/**
 * 笔记与高亮控制层 (NoteController)
 */

import { Controller, Post, Get, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/user.entity';
import { NoteService } from './note.service';
import { CreateNoteDto, CreateAnnotationDto } from './dto/create-note.dto';

@ApiTags('笔记与划线标注 Note')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @ApiOperation({ summary: '新建 Markdown 研读笔记' })
  async createNote(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateNoteDto,
  ) {
    return this.noteService.createNote(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的笔记列表' })
  async getUserNotes(
    @CurrentUser() user: UserEntity,
    @Query('docId') docId?: string,
  ) {
    return this.noteService.getUserNotes(user.id, docId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个笔记详情及其高亮卡片' })
  async getNoteDetail(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.noteService.getNoteDetail(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新笔记标题与正文' })
  async updateNote(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: Partial<CreateNoteDto>,
  ) {
    return this.noteService.updateNote(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定的笔记' })
  async deleteNote(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.noteService.deleteNote(id, user.id);
    return { message: '笔记已成功删除' };
  }

  // ------------ 高亮划线与坐标 (Annotations) ------------

  @Post('annotations')
  @ApiOperation({ summary: '创建 PDF/EPUB 原文高亮划线锚点' })
  async createAnnotation(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateAnnotationDto,
  ) {
    return this.noteService.createAnnotation(user.id, dto);
  }

  @Get('annotations/document/:docId')
  @ApiOperation({ summary: '获取特定文档下的所有高亮划线' })
  async getDocumentAnnotations(
    @Param('docId') docId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.noteService.getDocumentAnnotations(docId, user.id);
  }
}
