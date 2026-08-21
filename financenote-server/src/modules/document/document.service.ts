/**
 * 文档与后台向量切块服务 (DocumentService)
 * 
 * 核心逻辑：
 * 1. 存储文档元数据并在磁盘上建立受保护目录结构
 * 2. 分页查寻当前用户上传的书籍与财报列表
 * 3. 严格使用 1..N 顺序物理页码引擎异步解析 PDF 财报与图书文本，保障与阅读器 100% 匹配
 * 4. 存入 chunks 数据库供 AI 研读精确定位
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity, DocumentStatus, DocType } from './entities/document.entity';
import { DocumentChunkEntity } from './entities/chunk.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

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
   * 查询共享文档列表。文档按类型和关键词筛选，不按上传用户隔离。
   */
  async findDocuments(
    docType?: DocType,
    search?: string,
  ): Promise<DocumentEntity[]> {
    const query = this.docRepository
      .createQueryBuilder('doc')
      .where('1 = 1');

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

    // 共享阅读不需要所有权校验；删除等归属操作可传入 userId 做额外校验。
    if (userId !== undefined && doc.userId !== userId) {
      throw new ForbiddenException('您无权修改该文档');
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
   * 后台异步任务：按顺序 1..N 精确解析 PDF -> 提取文字 -> 滑动切块 -> 存入 chunk 表
   */
  async processDocumentBackground(docId: string, filePath: string) {
    this.logger.log(`[后台任务] 开始精确顺序解析 PDF 内容: ${docId}`);

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`物理文件不存在: ${filePath}`);
      }

      const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
      const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
      const pdfDoc = await loadingTask.promise;

      const chunksToInsert: Partial<DocumentChunkEntity>[] = [];
      let failedPages = 0;

      // 1..N 顺序严格遍历物理页码
      for (let p = 1; p <= pdfDoc.numPages; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');

          if (pageText.trim()) {
            const subChunks = this.splitTextIntoChunks(pageText, 600);
            for (const subText of subChunks) {
              chunksToInsert.push({
                docId,
                pageNumber: p,
                content: subText,
                metadata: { pageNumber: p, length: subText.length },
              });
            }
          }
        } catch (e) {
          failedPages += 1;
          this.logger.warn(`[后台任务] 文档 ${docId} 第 ${p} 页解析失败`);
        }
      }

      if (chunksToInsert.length === 0) {
        throw new Error('文档未解析出可检索文本');
      }

      await this.chunkRepository.save(chunksToInsert);

      // 更新文档解析状态为完成 PROCESSED
      await this.docRepository.update(docId, { status: DocumentStatus.PROCESSED });
      this.logger.log(`[后台任务] 文档 ${docId} 解析完成，共切出 ${chunksToInsert.length} 个片段，失败页数 ${failedPages}`);
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
      start += chunkSize - 100;
    }
    return chunks;
  }

  /**
   * 删除文档与本地物理文件
   */
  async removeDocument(id: string, userId: number): Promise<void> {
    const doc = await this.findOne(id, userId);

    await this.chunkRepository.delete({ docId: id });

    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        this.logger.warn(`删除物理文件失败: ${doc.filePath}`);
      }
    }

    await this.docRepository.remove(doc);
  }
}
