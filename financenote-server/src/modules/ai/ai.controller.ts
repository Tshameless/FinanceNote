/**
 * AI 研读助手控制器 (AiController)
 * 
 * 路由：
 * - POST /api/ai/stream : POST SSE 打字机流式打字输出 (HTTP 200 OK + 带 JWT 鉴权与出处页码)
 * - POST /api/ai/ask    : 检索上下文切块引用出处
 */

import { Controller, Post, Body, Res, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Subject } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { RagQueryDto } from './dto/rag-query.dto';

@ApiTags('AI 研读助手 AI Copilot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('stream')
  @HttpCode(200)
  @ApiOperation({ summary: 'POST SSE 研读打字机效果流式响应 (包含 [P42 页码出处])' })
  async streamAiAnswerPost(
    @Body() dto: RagQueryDto,
    @Res() res: Response,
  ) {
    // 设置 SSE 流式响应 Header
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subject = new Subject<any>();

    subject.subscribe({
      next: (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      complete: () => {
        res.end();
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        res.end();
      },
    });

    // 触发后台向量检索 RAG 问答与商汤 SenseNova 流式处理
    this.aiService.askDocumentRAGStream(dto.docId, dto.query, dto.topK || 5, subject);
  }

  @Post('ask')
  @HttpCode(200)
  @ApiOperation({ summary: '检索引用的出处页码列表 (查看 Context 出处)' })
  async getReferences(@Body() dto: RagQueryDto) {
    const sources = await this.aiService.retrieveContextChunks(dto.docId, dto.query, dto.topK || 5);
    return { sources };
  }
}
