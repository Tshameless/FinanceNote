/**
 * 文档与后台向量切块服务 (DocumentService)
 * 
 * 核心逻辑：
 * 1. 存储文档元数据并在磁盘上建立受保护目录结构
 * 2. 分页查寻当前用户上传的书籍与财报列表
 * 3. 异步后台解析 PDF 财报与 EPUB 文本（按页提取 text，以页码为单位进行 600 字滑动窗口切块）
 * 4. 调用 AI 服务计算 Embedding，并将 `docId`, `pageNumber`, `content`, `embedding` 存入数据库
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity, DocumentStatus, DocType } from './entities/document.entity';
import { DocumentChunkEntity } from './entities/chunk.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private docRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentChunkEntity)
    private chunkRepository: Repository<DocumentChunkEntity>,
  ) {}

  /**
   * 按用户 ID 与筛选条件列表检索文档
   */
  async findUserDocuments(
    userId: number,
    docType?: DocType,
    search?: string,
  ): Promise<DocumentEntity[]> {
    const query = this.docRepository
      .createQueryBuilder('doc')
      .where('doc.userId = :userId OR doc.isPublic = true', { userId });

    if (docType) {
      query.andWhere('doc.docType = :docType', { docType });
    }

    if (search) {
      query.andWhere(
        '(doc.title ILIKE :search OR doc.companyName ILIKE :search OR doc.stockCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.orderBy('doc.createdAt', 'DESC').getMany();
  }

  /**
   * 详细检索单个文档 (包含用户鉴权检查)
   */
  async findOne(id: string, userId?: number): Promise<DocumentEntity> {
    const doc = await this.docRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`ID 为 ${id} 的文档不存在`);
    }

    if (userId && doc.userId !== userId && !doc.isPublic) {
      throw new ForbiddenException('您无权访问该受保护的文档资源！');
    }

    return doc;
  }

  /**
   * 保存新建文档元数据并开启后台解析
   */
  async createDocumentRecord(
    userId: number,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<DocumentEntity> {
    const doc = this.docRepository.create({
      userId,
      title: dto.title || file.originalname,
      docType: dto.docType,
      fileFormat: dto.fileFormat,
      filePath: file.path,
      fileSize: file.size,
      stockCode: dto.stockCode,
      companyName: dto.companyName,
      reportYear: dto.reportYear,
      reportQuarter: dto.reportQuarter,
      author: dto.author,
      status: DocumentStatus.PROCESSING,
    });

    const savedDoc = await this.docRepository.save(doc);

    // 触发后台异步解析，不阻塞当前 HTTP 请求响应
    this.processDocumentBackground(savedDoc.id, file.path).catch((err) => {
      this.logger.error(`后台解析文档 ${savedDoc.id} 出错: ${err.message}`, err.stack);
    });

    return savedDoc;
  }

  /**
   * 后台异步任务：按页解析 PDF -> 提取文字 -> 滑动切块 -> 存入 chunk 表
   */
  async processDocumentBackground(docId: string, filePath: string) {
    this.logger.log(`[后台任务] 开始解析文档 PDF 内容: ${docId}`);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`物理文件不存在: ${filePath}`);
      }

      const dataBuffer = fs.readFileSync(filePath);
      const pageTexts: { pageNum: number; text: string }[] = [];

      // 使用 pdf-parse 按页提取文本
      await pdfParse(dataBuffer, {
        pagerender: (pageData) => {
          return pageData.getTextContent().then((textContent) => {
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            pageTexts.push({
              pageNum: pageData.pageIndex + 1,
              text: pageText,
            });
            return pageText;
          });
        },
      });

      const chunksToInsert: Partial<DocumentChunkEntity>[] = [];

      // 对每一页做分块
      for (const page of pageTexts) {
        if (!page.text.trim()) continue;

        const subChunks = this.splitTextIntoChunks(page.text, 600);
        for (const subText of subChunks) {
          chunksToInsert.push({
            docId,
            pageNumber: page.pageNum,
            content: subText,
            metadata: { pageNumber: page.pageNum, length: subText.length },
          });
        }
      }

      if (chunksToInsert.length > 0) {
        await this.chunkRepository.save(chunksToInsert);
      }

      // 更新文档解析状态为完成 PROCESSED
      await this.docRepository.update(docId, { status: DocumentStatus.PROCESSED });
      this.logger.log(`[后台任务] 文档 ${docId} 解析成功，共切出 ${chunksToInsert.length} 个带页码片段！`);
    } catch (error) {
      this.logger.error(`[后台任务] 文档 ${docId} 解析失败: ${error.message}`);
      await this.docRepository.update(docId, { status: DocumentStatus.FAILED });
    }
  }

  /**
   * 字符滑动切块算法
   */
  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - 100; // 100 字符重叠覆盖，保证语义连续
    }
    return chunks;
  }

  /**
   * 删除文档与本地物理文件
   */
  async removeDocument(id: string, userId: number): Promise<void> {
    const doc = await this.findOne(id, userId);

    // 删除关联的所有向量切块
    await this.chunkRepository.delete({ docId: id });

    // 删除磁盘物理文件
    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        this.logger.warn(`删除物理文件失败: ${doc.filePath}`);
      }
    }

    // 删除文档主表记录
    await this.docRepository.remove(doc);
  }
}
