/**
 * 笔记模块声明 (NoteModule)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './entities/note.entity';
import { AnnotationEntity } from './entities/annotation.entity';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { DocumentEntity } from '../document/entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity, AnnotationEntity, DocumentEntity])],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
