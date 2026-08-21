/**
 * FinanceNote - NestJS 后端入口启动文件
 * 
 * 核心逻辑包括：
 * 1. 自动读取环境变量并初始化 NestFactory 应用
 * 2. 启用跨域 (CORS) 允许前端 Vue 3 安全访问
 * 3. 注册全局 ValidationPipe 实现强类型 Class-Validator 入参校验
 * 4. 注册全局 HttpExceptionFilter 统一错误异常日志与 HTTP 状态响应
 * 5. 注册全局 TransformInterceptor 统一 API 成功 JSON 返回格式
 * 6. 配置 Swagger API 交互文档
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // 创建 NestJS 应用程序实例
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(cookieParser());
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-a-long-random-secret')) {
    throw new Error('生产环境必须配置独立的 JWT_SECRET');
  }

  // 基础响应安全头；文件流仍由受保护控制器输出，不暴露上传目录。
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; frame-ancestors 'self'");
    next();
  });

  // 1. 开启 CORS 跨域支持 (为 Vue 3 前端提供安全访问)
  app.enableCors({
    origin: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. 统一全局路由前缀 (例如: /api/v1)
  app.setGlobalPrefix('api');

  // 3. 注册全局强类型 Pipes 数据 Pipe 校验器
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // 自动剔除未声明的属性，提升安全性
      transform: true,            // 自动转换为目标 DTO 类型
      forbidNonWhitelisted: true, // 若包含未在 DTO 中定义的字段则报错
    }),
  );

  // 4. 注册全局异常过滤器 (拦截所有未捕获异常，输出标准 JSON)
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. 注册全局响应拦截器 (统一 { code: 200, message: 'success', data: ... } 结构)
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. 配置 Swagger 接口文档平台
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FinanceNote API 说明文档')
    .setDescription('FinanceNote 财报与书籍深度研读笔记系统 Backend Services')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // 7. 启动服务监听
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 FinanceNote 后端服务已成功在端口 http://localhost:${port}/api 启动运行`);
  logger.log(`📚 Swagger 交互式接口文档访问地址: http://localhost:${port}/api/docs`);
}

bootstrap();
