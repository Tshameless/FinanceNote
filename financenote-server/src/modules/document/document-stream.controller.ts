/**
 * 受保护的文件流播放控制器 (DocumentStreamController)
 * 
 * 核心安全机制：
 * 1. 【安全防爆破】禁用静态公开 HTTP 目录。所有书籍 PDF/EPUB 文件仅存储在后端私有受保护目录中。
 * 2. 【强制登录】必须携带合法的 JWT 令牌访问 `GET /api/documents/:id/stream`。
 * 3. 【越权检查】拦截试图读取他人私有书籍或财报的非法请求（403 Forbidden）。
 * 4. 【HTTP 206 Range 支持】实现视频/大 PDF 文件的分段流式输出，完美适配 PDF.js / EPUB.js 的增量加载与快速翻页。
 */

import { Controller, Get, Param, Req, Res, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentService } from './document.service';
import { UserEntity } from '../user/user.entity';
import * as fs from 'fs';

@ApiTags('受保护资源传输 Stream')
@Controller('documents')
export class DocumentStreamController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/stream')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '受保护的书籍/财报文件流播放 (支持 206 Range 分片传输)' })
  async streamDocument(
    @Param('id') id: string,
    @Req() req: Request & { user: UserEntity },
    @Res() res: Response,
  ) {
    const userId = req.user.id;

    // 1. 查询文档并验证所有权
    const doc = await this.documentService.findOne(id);
    if (!doc) {
      throw new NotFoundException('请求的书籍或财报文件不存在');
    }

    if (doc.userId !== userId && !doc.isPublic) {
      throw new ForbiddenException('警告：您无权阅读该受保护的书籍/财报文件！');
    }

    const filePath = doc.filePath;
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('磁盘上的物理文件未找到');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const contentType =
      doc.fileFormat === 'PDF' ? 'application/pdf' : 'application/epub+zip';

    // 2. 处理 HTTP 206 Range 分片流式传输 (PDF.js 渐进式加载核心)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      });

      fileStream.pipe(res);
    } else {
      // 3. 普通整文件流传输
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }
}
