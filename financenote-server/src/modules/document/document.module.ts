/**
 * 文档模块声明 (DocumentModule)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './entities/document.entity';
import { DocumentChunkEntity } from './entities/chunk.entity';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentStreamController } from './document-stream.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentChunkEntity])],
  controllers: [DocumentController, DocumentStreamController],
  providers: [DocumentService],
  exports: [DocumentService, TypeOrmModule],
})
export class DocumentModule {}
