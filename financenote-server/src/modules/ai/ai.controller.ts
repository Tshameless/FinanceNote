/**
 * AI 研读助手控制器 (AiController)
 * 
 * 路由：
 * - POST /api/ai/ask : HTTP 常见问答 (单次完整返回)
 * - Sse  /api/ai/stream : SSE (Server-Sent Events) 打字机效果流式响应
 */

import { Controller, Post, Body, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { RagQueryDto } from './dto/rag-query.dto';

@ApiTags('AI 研读助手 AI Copilot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'SSE (Server-Sent Events) 研读打字机效果流式输出' })
  streamAiAnswer(@Body() dto: RagQueryDto): Observable<MessageEvent> {
    const subject = new Subject<any>();

    // 触发后台 RAG 问答与大模型流处理
    this.aiService.askDocumentRAGStream(dto.docId, dto.query, dto.topK || 5, subject);

    // 将 RxJS Subject 转为标准的 SSE MessageEvent 结构
    return subject.asObservable().pipe(
      map((data) => ({
        data: JSON.stringify(data),
      }) as MessageEvent),
    );
  }

  @Post('ask')
  @ApiOperation({ summary: '检索引用的出处页码列表 (查看 Context 出处)' })
  async getReferences(@Body() dto: RagQueryDto) {
    const sources = await this.aiService.retrieveContextChunks(dto.docId, dto.query, dto.topK || 5);
    return { sources };
  }
}
