/**
 * AI 研读助手模块声明 (AiModule)
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from '../document/entities/document.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([DocumentEntity]), ConversationModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
