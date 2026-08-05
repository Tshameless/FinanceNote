/**
 * FinanceNote - NestJS 根模块 (AppModule)
 * 
 * 职责划分：
 * 1. 负责加载全系统的 `.env` 环境变量配置 (ConfigModule)
 * 2. 负责配置 TypeORM 与 MySQL 数据库连接
 * 3. 负责全局限流保护 (ThrottlerModule) 防止恶意频繁调用 API
 * 4. 负责导入各业务核心子模块：AuthModule, UserModule, DocumentModule, NoteModule, AiModule
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// 导入业务核心模块
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DocumentModule } from './modules/document/document.module';
import { NoteModule } from './modules/note/note.module';
import { AiModule } from './modules/ai/ai.module';

// 导入实体 Entity
import { UserEntity } from './modules/user/user.entity';
import { DocumentEntity } from './modules/document/entities/document.entity';
import { DocumentChunkEntity } from './modules/document/entities/chunk.entity';
import { NoteEntity } from './modules/note/entities/note.entity';
import { AnnotationEntity } from './modules/note/entities/annotation.entity';

@Module({
  imports: [
    // 1. 全局配置模块 (支持读取项目根目录的 .env 文件)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 2. MySQL / PostgreSQL 数据库连接模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: (configService.get<string>('DB_TYPE') || 'mysql') as any,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', '123456'),
        database: configService.get<string>('DB_DATABASE', 'financenote'),
        entities: [
          UserEntity,
          DocumentEntity,
          DocumentChunkEntity,
          NoteEntity,
          AnnotationEntity,
        ],
        synchronize: true, // 自动增量创建更新数据库表与字段
        logging: false,
      }),
    }),

    // 3. 全局 API 速率限制 (Throttler)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // 4. 业务子模块划分
    AuthModule,
    UserModule,
    DocumentModule,
    NoteModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
