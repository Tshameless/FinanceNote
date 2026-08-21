/**
 * 文档元数据管理与上传控制器 (DocumentController)
 * 
 * 路由：
 * - POST /api/documents/upload : 上传 PDF/EPUB 财报或书籍
 * - GET  /api/documents        : 查询用户上传的文档列表
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
    const expectedFormat = extension === '.pdf' ? 'PDF' : 'EPUB';
    if (dto.fileFormat !== expectedFormat) {
      throw new BadRequestException('文件扩展名与 fileFormat 不一致');
    }
    if (expectedFormat === 'EPUB') {
      throw new BadRequestException('EPUB 解析尚未启用，请上传 PDF 文件');
    }

    return this.documentService.createDocumentRecord(user.id, file, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取当前登录用户的文档列表' })
  async getDocuments(
    @CurrentUser() user: UserEntity,
    @Query('docType') docType?: DocType,
    @Query('search') search?: string,
  ) {
    return this.documentService.findUserDocuments(user.id, docType, search);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文档详细元数据' })
  async getDocumentDetail(
    @Param('id') id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.documentService.findOne(id, user.id);
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
}
