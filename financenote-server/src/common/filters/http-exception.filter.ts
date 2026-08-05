/**
 * 全局 HTTP 异常过滤器 (HttpExceptionFilter)
 * 
 * 作用：
 * 拦截系统中所有由 NestJS 抛出的 HttpException（如 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error），
 * 格式化为标准化的响应数据结构，防止内部堆栈信息直接暴露给前端，提升系统安全性与友好度。
 */

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判断是否为 NestJS 的 HttpException
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = '服务器内部发生未捕获的错误，请联系系统管理员';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      // 提取 Class-Validator 校验错误信息数组
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join('; ')
        : exceptionResponse.message || message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录错误日志
    this.logger.error(
      `HTTP ${status} Error [${request.method} ${request.url}]: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // 返回统一错误响应 JSON 格式
    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
