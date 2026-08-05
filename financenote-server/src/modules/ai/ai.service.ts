/**
 * AI 研读助手服务实现 (AiService)
 * 
 * 核心设计模式与技术点：
 * 1. 【后端安全屏障】使用 process.env.DEEPSEEK_API_KEY 实例化 OpenAI / DeepSeek 客户端。Key 严保存留在后端，前端零触碰。
 * 2. 【RAG 向量检索】利用 PostgreSQL (pgvector) 进行针对文档的语义向量相似度匹配，检索与提问最契合的财报切块片段与对应页码 (pageNumber)。
 * 3. 【打字机效果 (SSE Stream)】通过 RxJS Subject 将模型生成的流式 Chunk 增量推送给 NestJS Controller 的 @Sse 终端。
 * 4. 【精准页码出处 Grounding】先向前端推送引用的出处的元数据 [{ pageNumber: 42, section: "..." }]，便于前端点击跳转。
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
    const baseURL = this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com/v1';

    // 实例化 OpenAI/DeepSeek API 客户端 (绝对不在前端曝光)
    this.openaiClient = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  /**
   * PostgreSQL pgvector 语义检索相关的文本切块
   */
  async retrieveContextChunks(docId: string, query: string, topK = 5): Promise<SourceReference[]> {
    try {
      // 1. 生成查询文本的向量 Embedding (使用 DeepSeek / OpenAI embedding 模型)
      const embedding = await this.generateEmbedding(query);

      if (!embedding || embedding.length === 0) {
        // 若缺少向量库支持，降级使用普通全文模糊匹配 query
        return this.fallbackKeywordSearch(docId, query, topK);
      }

      const embeddingArrayStr = `[${embedding.join(',')}]`;

      // 2. 执行 pgvector 相似度查询 1 - (embedding <=> $1)
      const rawResults = await this.dataSource.query(
        `SELECT id, content, page_number as "pageNumber", metadata
         FROM document_chunks
         WHERE doc_id = $1
         ORDER BY embedding <=> $2 ASC
         LIMIT $3`,
        [docId, embeddingArrayStr, topK],
      );

      return rawResults.map((r: any) => ({
        pageNumber: r.pageNumber,
        content: r.content,
        metadata: r.metadata,
      }));
    } catch (error) {
      this.logger.warn(`pgvector 向量检索出错，自动回退到关键字模糊检索: ${error.message}`);
      return this.fallbackKeywordSearch(docId, query, topK);
    }
  }

  /**
   * 降级关键字检索 (文本模糊匹配)
   */
  private async fallbackKeywordSearch(docId: string, query: string, topK: number): Promise<SourceReference[]> {
    try {
      const rawResults = await this.dataSource.query(
        `SELECT id, content, pageNumber, metadata
         FROM document_chunks
         WHERE docId = ? AND content LIKE ?
         LIMIT ?`,
        [docId, `%${query.slice(0, 10)}%`, topK],
      );

      if (rawResults.length === 0) {
        const defaultResults = await this.dataSource.query(
          `SELECT id, content, pageNumber, metadata
           FROM document_chunks
           WHERE docId = ?
           LIMIT ?`,
          [docId, topK],
        );
        return defaultResults.map((r: any) => ({ pageNumber: r.pageNumber, content: r.content, metadata: r.metadata }));
      }

      return rawResults.map((r: any) => ({
        pageNumber: r.pageNumber,
        content: r.content,
        metadata: r.metadata,
      }));
    } catch (err) {
      this.logger.error(`数据库检索切块出错: ${err.message}`);
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
      this.logger.error(`生成向量 Embedding 失败: ${err.message}`);
      return [];
    }
  }

  /**
   * 流式问答打字机 RAG 交互 Pipeline
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
        sources: sources.map((s) => ({ pageNumber: s.pageNumber, snippet: s.content.slice(0, 80) })),
      });

      // Step 2: 组装 Prompt
      const contextPrompt = sources
        .map((s) => `[出处: 第 ${s.pageNumber} 页]:\n${s.content}`)
        .join('\n\n---\n\n');

      const systemPrompt = `你是一名精通财报分析与深度阅读的 AI 研读助手。
请根据下方提供的文档切块内容回答用户的提问。

要求：
1. 必须基于文档回答，回答中涉及的具体数据、核心论点或风险提示，必须在句末标注出处页码，格式例如：[第42页]。
2. 保持回答专业、客观、逻辑条理清晰，多使用 Markdown 列表或表格进行呈现。
3. 如果文档上下文中未提及相关信息，请明确告知用户。

文档参考上下文:
${contextPrompt || '暂无查找到相关切块'}`;

      // Step 3: 调用商用 LLM 流式输出 (商汤 SenseNova / DeepSeek)
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
