/**
 * AI 研读助手控制器 (AiController)
 */

import { Controller, Post, Body, Res, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { Subject } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../user/user.entity';
import { ConversationService } from '../conversation/conversation.service';
import { MessageRole } from '../conversation/entities/message.entity';
import { AiService } from './ai.service';
import { RagQueryDto } from './dto/rag-query.dto';

@ApiTags('AI 研读助手 AI Copilot')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService, private readonly conversationService: ConversationService) {}

  @Post('stream')
  @HttpCode(200)
  @ApiOperation({ summary: 'POST SSE 研读打字机效果流式响应 (包含 [P42 页码出处])' })
  async streamAiAnswerPost(
    @Body() dto: RagQueryDto,
    @CurrentUser() user: UserEntity,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // 设置 SSE 流式响应 Header
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let closed = false;
    const abortController = new AbortController();
    req.on('close', () => {
      closed = true;
      abortController.abort();
    });

    const conversation = await this.conversationService.getOrCreate(user.id, dto.conversationId, dto.docId, dto.query.slice(0, 80));
    await this.conversationService.addMessage(user.id, conversation.id, MessageRole.USER, dto.query);
    let assistantText = '';
    let assistantSources: Array<{ id?: string; pageNumber: number; snippet?: string }> = [];
    const subject = new Subject<any>();

    subject.subscribe({
      next: (data) => {
        if (data.type === 'text') assistantText += data.content || '';
        if (data.type === 'sources') assistantSources = data.sources || [];
        if (!closed && !res.writableEnded) res.write(`data: ${JSON.stringify({ ...data, conversationId: conversation.id })}\n\n`);
      },
      complete: () => {
        res.end();
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        res.end();
      },
    });

    // 触发后台向量检索 RAG 问答与商汤 SenseNova 流式处理 (包含当前页码 dto.currentPage)
    await this.aiService.askDocumentRAGStream(dto.docId, dto.query, dto.topK || 5, subject, dto.currentPage, abortController.signal);
    if (assistantText && !closed) {
      await this.conversationService.addMessage(user.id, conversation.id, MessageRole.ASSISTANT, assistantText, assistantSources);
    }
  }

  @Post('ask')
  @HttpCode(200)
  @ApiOperation({ summary: '检索引用的出处页码列表 (查看 Context 出处)' })
  async getReferences(@Body() dto: RagQueryDto) {
    const sources = await this.aiService.retrieveContextChunks(dto.docId, dto.query, dto.topK || 5, dto.currentPage);
    return { sources };
  }
}
