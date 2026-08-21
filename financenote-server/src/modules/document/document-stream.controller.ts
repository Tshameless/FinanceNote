/**
 * 受保护的文件流播放控制器 (DocumentStreamController)
 * 
 * 核心安全机制：
 * 1. 【安全防爆破】禁用静态公开 HTTP 目录。文档文件仅存储在后端私有受保护目录中。
 * 2. 【强制登录】必须携带合法的 JWT 令牌访问 `GET /api/documents/:id/stream`。
 * 3. 公开文档可供登录用户阅读，私有文档仅上传者可读；删除仍受上传者归属控制。
 * 4. 【HTTP 206 Range 支持】实现大 PDF 文件的分段流式输出，适配 PDF.js 增量加载与快速翻页。
 */

import { Controller, Get, Param, Req, Res, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/user.entity';
import { DocumentService } from './document.service';
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
    @CurrentUser() user: UserEntity,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // 1. 查询当前用户可访问的文档；接口本身仍要求登录
    const doc = await this.documentService.findOne(id, user.id);
    if (!doc) {
      throw new NotFoundException('请求的书籍或财报文件不存在');
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
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        throw new BadRequestException('Range 格式无效');
      }
      const start = match[1] ? Number(match[1]) : Math.max(0, fileSize - Number(match[2]));
      const requestedEnd = match[2] && match[1] ? Number(match[2]) : fileSize - 1;
      const end = Math.min(requestedEnd, fileSize - 1);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        return;
      }
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
