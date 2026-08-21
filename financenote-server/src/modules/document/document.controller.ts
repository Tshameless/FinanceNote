/**
 * 文档元数据管理与上传控制器 (DocumentController)
 * 
 * 路由：
 * - POST /api/documents/upload : 上传 PDF/EPUB 财报或书籍
 * - GET  /api/documents        : 查询共享文档列表（支持类型筛选）
 * - GET  /api/documents/:id    : 获取单个文档详情
 * - DELETE /api/documents/:id : 删除文档
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/user.entity';
import { DocumentService } from './document.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocType } from './entities/document.entity';

// 自定义 multer 存储策略，将物理文件存放在受保护的磁盘目录中
const multerStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('文档与财报管理 Document')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传财报 PDF 或 EPUB 书籍资源' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 限制最大 100MB
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|epub)$/i)) {
          return cb(new BadRequestException('格式错误：仅支持上传 PDF 或 EPUB 格式文件！'), false);
        }
        const acceptedMimeTypes = new Set(['application/pdf', 'application/epub+zip']);
        if (file.mimetype && !acceptedMimeTypes.has(file.mimetype)) {
          return cb(new BadRequestException('文件 MIME 类型与支持的格式不匹配'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('请选择上传的文件！');
    }

    const extension = extname(file.originalname).toLowerCase();
    const expectedFormat = extension === '.pdf' ? 'PDF' : extension === '.epub' ? 'EPUB' : null;
    if (!expectedFormat) {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('仅支持 PDF 文件');
    }
    if (dto.fileFormat !== expectedFormat) {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('文件扩展名与 fileFormat 不一致');
    }
    if (expectedFormat === 'EPUB') {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('EPUB 解析尚未启用，请上传 PDF 文件');
    }

    // 扩展名和 MIME 都可伪造，检查 PDF 文件头，避免把任意文件交给解析器。
    if (!this.isPdfFile(file.path)) {
      this.removeUploadedFile(file.path);
      throw new BadRequestException('文件内容不是有效的 PDF');
    }

    try {
      const document = await this.documentService.createDocumentRecord(user.id, file, dto);
      return this.toPublicDocument(document);
    } catch (error) {
      this.removeUploadedFile(file.path);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: '获取共享文档列表（支持财报/书籍类型筛选）' })
  async getDocuments(
    @Query('docType') docType?: DocType,
    @Query('search') search?: string,
  ) {
    const documents = await this.documentService.findDocuments(docType, search);
    return documents.map((document) => this.toPublicDocument(document));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取共享文档详细元数据' })
  async getDocumentDetail(
    @Param('id') id: string,
  ) {
    const document = await this.documentService.findOne(id);
    return this.toPublicDocument(document);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定的文档与文件' })
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.documentService.removeDocument(id, user.id);
    return { message: '文档成功删除' };
  }

  /** 对外只返回展示所需字段，避免泄露磁盘路径和内部处理错误。 */
  private toPublicDocument(document: any) {
    return {
      id: document.id,
      title: document.title,
      docType: document.docType,
      fileFormat: document.fileFormat,
      fileSize: document.fileSize,
      stockCode: document.stockCode,
      companyName: document.companyName,
      reportYear: document.reportYear,
      reportQuarter: document.reportQuarter,
      author: document.author,
      status: document.status,
      processingProgress: document.processingProgress,
      processingAttempts: document.processingAttempts,
      processingError: document.status === 'FAILED' ? '文档解析失败，请重试或联系管理员' : undefined,
      isPublic: document.isPublic,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private isPdfFile(filePath: string): boolean {
    let handle: number | undefined;
    try {
      handle = fs.openSync(filePath, 'r');
      const header = Buffer.alloc(5);
      const bytesRead = fs.readSync(handle, header, 0, header.length, 0);
      return bytesRead === 5 && header.toString('ascii') === '%PDF-';
    } catch {
      return false;
    } finally {
      if (handle !== undefined) fs.closeSync(handle);
    }
  }

  private removeUploadedFile(filePath: string): void {
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // 清理失败不覆盖原始校验错误，后续由运维任务清理孤儿文件。
    }
  }
}
