/**
 * AI 研读助手服务实现 (AiService)
 * 
 * 核心优化：
 * 1. 优先结合用户【当前处于的 PDF 页码 (currentPage)】进行上下文精准抽取，解决页码偏差 Bug
 * 2. 引入停用词过滤 (过滤“什么是/总结一下/如何/怎么”)，锁定精准业务关键词
 * 3. 强指令提示词 (System Prompt)：要求 LLM 严格依据提供的切块页码标注 [第 X 页] 出处
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
   * 检索最相关的文本切块与对应物理页码
   */
  async retrieveContextChunks(
    docId: string,
    query: string,
    topK = 5,
    currentPage?: number,
  ): Promise<SourceReference[]> {
    const results: SourceReference[] = [];

    // 优先逻辑 A：若用户传入了当前视口页码 currentPage (例如 42 页)，优先抽取 42 页及其前后 2 页切块
    if (currentPage && currentPage > 0) {
      try {
        const pageNearbyChunks = await this.dataSource.query(
          `SELECT id, content, pageNumber, metadata
           FROM document_chunks
           WHERE docId = ? AND pageNumber BETWEEN ? AND ?
           ORDER BY pageNumber ASC
           LIMIT 4`,
          [docId, Math.max(1, currentPage - 1), currentPage + 2],
        );

        if (pageNearbyChunks && pageNearbyChunks.length > 0) {
          pageNearbyChunks.forEach((r: any) => {
            results.push({
              pageNumber: Number(r.pageNumber || 1),
              content: r.content,
              metadata: r.metadata,
            });
          });
        }
      } catch (err) {
        this.logger.warn(`按页码抽取切块警示: ${err.message}`);
      }
    }

    // 逻辑 B：中文停用词过滤提取核心搜索关键词
    const stopWords = new Set(['请', '总结', '一下', '什么是', '如何', '怎么', '有哪些', '分析', '核心', '观点', '的', '是', '在', '和', '与', '这', '那', '有', '说明', '讲了', '意思']);
    const rawTokens = query.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').split(/\s+/);
    const keywords = rawTokens.filter((w) => w.length >= 2 && !stopWords.has(w));

    if (keywords.length > 0) {
      for (const kw of keywords.slice(0, 3)) {
        try {
          const kwResults = await this.dataSource.query(
            `SELECT id, content, pageNumber, metadata
             FROM document_chunks
             WHERE docId = ? AND content LIKE ?
             ORDER BY pageNumber ASC
             LIMIT ?`,
            [docId, `%${kw}%`, Math.ceil(topK / keywords.length)],
          );

          if (kwResults && kwResults.length > 0) {
            kwResults.forEach((r: any) => {
              // 避免重复引入相同 chunk
              if (!results.some((existing) => existing.content === r.content)) {
                results.push({
                  pageNumber: Number(r.pageNumber || 1),
                  content: r.content,
                  metadata: r.metadata,
                });
              }
            });
          }
        } catch (e) {}
      }
    }

    // 逻辑 C：若依然不足，兜底获取文档前 TopK 块
    if (results.length === 0) {
      try {
        const fallbackResults = await this.dataSource.query(
          `SELECT id, content, pageNumber, metadata
           FROM document_chunks
           WHERE docId = ?
           ORDER BY pageNumber ASC
           LIMIT ?`,
          [docId, topK],
        );
        (fallbackResults || []).forEach((r: any) => {
          results.push({
            pageNumber: Number(r.pageNumber || 1),
            content: r.content,
            metadata: r.metadata,
          });
        });
      } catch (e) {}
    }

    return results.slice(0, topK);
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
   * 流式打字机 RAG 问答 (带严格 [第 X 页] 出处要求与当前页匹配)
   */
  async askDocumentRAGStream(
    docId: string | undefined,
    query: string,
    topK: number,
    subject: Subject<any>,
    currentPage?: number,
  ) {
    try {
      let sources: SourceReference[] = [];
      if (docId) {
        sources = await this.retrieveContextChunks(docId, query, topK, currentPage);
        // 推送引用的出处页码给前端
        subject.next({
          type: 'sources',
          sources: sources.map((s) => ({
            pageNumber: s.pageNumber,
            snippet: s.content.slice(0, 80),
          })),
        });
      }

      // Step 2: 组装 Prompt
      const contextPrompt = sources
        .map((s) => `--- 【参考出处: 第 ${s.pageNumber} 页】 ---\n${s.content}`)
        .join('\n\n');

      const currentContextHint = currentPage
        ? `用户当前正在阅读 PDF 的【第 ${currentPage} 页】。`
        : '';

      const systemPrompt = docId
        ? `你是一名精通财报分析与图书研读的 AI 助手。
${currentContextHint}
请仔细阅读下方提供的文档参考切块内容，并回答用户的提问。

【核心引用规范与要求】：
1. 你的每一个主要回答结论、数据或论述段落后，必须明确标注出处页码，格式严格为：[第 X 页]。例如：“公司经营活动现金流量净额为 665.9 亿元 [第 42 页]。”
2. 标注的页码 X 必须严格来自于下方参考切块的【参考出处: 第 X 页】，不得凭空捏造页码。
3. 请保持专业、条理清晰，多使用 Markdown 列表。若参考资料中未提及相关内容，请明确告知用户。

参考切块资料上下文:
${contextPrompt || '暂无查找到匹配切块'}`
        : `你是一名精通金融学、微宏观经济学与财报研读的资深 AI 专家助手。请结合经济学原理、商业模式护城河与财报分析视角，回答用户的提问，保持专业、条理清晰并多使用 Markdown 列表结构。`;

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
