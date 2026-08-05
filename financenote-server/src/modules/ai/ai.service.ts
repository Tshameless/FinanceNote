/**
 * AI 研读助手服务实现 (AiService)
 * 
 * 核心功能：
 * 1. 结合 MySQL 向量/全文关键字匹配检索最相关的切块段落与对应 [页码 pageNumber]
 * 2. 强指令提示词 (System Prompt)：要求 LLM 必须为每一个观点和数据标注 [第 X 页] 出处
 * 3. 通过 SSE 将包含 [页码] 的出处来源与增量文本推送至前端 Vue 3
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { OpenAI } from 'openai';
import { Subject } from 'rxjs';

export interface SourceReference {
  pageNumber: number;
  content: string;
  metadata?: any;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiClient: OpenAI;

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || 'sk-demo';
    const baseURL = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://token.sensenova.cn/v1';

    this.openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  /**
   * 检索最相关的文本切块与对应页码
   */
  async retrieveContextChunks(docId: string, query: string, topK = 5): Promise<SourceReference[]> {
    try {
      // 1. 尝试向量 Embedding 检索
      const embedding = await this.generateEmbedding(query);
      if (embedding && embedding.length > 0) {
        const embeddingArrayStr = `[${embedding.join(',')}]`;
        const rawResults = await this.dataSource.query(
          `SELECT id, content, pageNumber, metadata
           FROM document_chunks
           WHERE docId = ?
           ORDER BY embedding <=> ? ASC
           LIMIT ?`,
          [docId, embeddingArrayStr, topK],
        );
        if (rawResults && rawResults.length > 0) {
          return rawResults.map((r: any) => ({
            pageNumber: Number(r.pageNumber || r.page_number || 1),
            content: r.content,
            metadata: r.metadata,
          }));
        }
      }
    } catch (error) {
      this.logger.warn(`向量检索不可用或提示: ${error.message}，自动降级为文本切块关键字匹配`);
    }

    return this.fallbackKeywordSearch(docId, query, topK);
  }

  /**
   * 降级关键字与多词匹配检索
   */
  private async fallbackKeywordSearch(docId: string, query: string, topK: number): Promise<SourceReference[]> {
    try {
      // 提取提问关键词
      const keywords = query.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 1);
      const searchPattern = keywords.length > 0 ? `%${keywords[0]}%` : `%${query.slice(0, 6)}%`;

      const rawResults = await this.dataSource.query(
        `SELECT id, content, pageNumber, metadata
         FROM document_chunks
         WHERE docId = ? AND content LIKE ?
         LIMIT ?`,
        [docId, searchPattern, topK],
      );

      let finalResults = rawResults;

      // 若模糊搜索没匹配到，取前 N 块切块填充出处
      if (!finalResults || finalResults.length === 0) {
        finalResults = await this.dataSource.query(
          `SELECT id, content, pageNumber, metadata
           FROM document_chunks
           WHERE docId = ?
           LIMIT ?`,
          [docId, topK],
        );
      }

      return (finalResults || []).map((r: any) => ({
        pageNumber: Number(r.pageNumber || r.page_number || 1),
        content: r.content,
        metadata: r.metadata,
      }));
    } catch (err) {
      this.logger.error(`数据库切块检索异常: ${err.message}`);
      return [];
    }
  }

  /**
   * 生成向量 Embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const res = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 2000),
      });
      return res.data[0]?.embedding || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * 流式打字机 RAG 问答 (带严格 [第 X 页] 出处要求)
   */
  async askDocumentRAGStream(
    docId: string,
    query: string,
    topK: number,
    subject: Subject<any>,
  ) {
    try {
      // Step 1: 检索相关的向量切块与页码
      const sources = await this.retrieveContextChunks(docId, query, topK);

      // 先向前端推传送检索到的引用源页码信息 (包含 pageNumber)
      subject.next({
        type: 'sources',
        sources: sources.map((s) => ({
          pageNumber: s.pageNumber,
          snippet: s.content.slice(0, 80),
        })),
      });

      // Step 2: 组装带页码的 Prompt
      const contextPrompt = sources
        .map((s) => `--- 【切块出处: 第 ${s.pageNumber} 页】 ---\n${s.content}`)
        .join('\n\n');

      const systemPrompt = `你是一名精通财报分析与图书研读的 AI 助手。
请仔细阅读下方提供的文档参考切块内容，并回答用户的提问。

【核心引用规范与要求】：
1. 你的每一个主要回答结论、数据或论点后，必须明确标注出处页码，格式严格为：[第 X 页]。例如：“公司经营活动现金流量净额为 665.9 亿元 [第 42 页]。”
2. 即使提问者没有明确询问页码，你也必须在每个推演段落后带上出处的 [第 X 页] 标签。
3. 请保持专业、条理清晰，多使用 Markdown 列表。若参考资料中未提及相关内容，请明确告知用户。

参考切块资料上下文:
${contextPrompt || '暂无查找到匹配切块'}`;

      // Step 3: 调用商用大模型流式输出
      const modelName = this.configService.get<string>('AI_MODEL_NAME', 'sensenova-6.7-flash-lite');
      const responseStream = await this.openaiClient.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        stream: true,
        temperature: 0.3,
      });

      for await (const chunk of responseStream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          subject.next({ type: 'text', content: text });
        }
      }

      subject.next({ type: 'done' });
      subject.complete();
    } catch (error) {
      this.logger.error(`AI 研读流式生成出错: ${error.message}`);
      subject.next({ type: 'error', message: error.message || 'AI 研读助手服务异常' });
      subject.complete();
    }
  }
}
