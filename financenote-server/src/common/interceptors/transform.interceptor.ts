/**
 * 全局响应成功拦截器 (TransformInterceptor)
 * 
 * 作用：
 * 统一将 Controller 业务代码返回的数据包裹为标准的 JSON 响应结构：
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... },
 *   "timestamp": "2026-08-05T23:00:00.000Z"
 * }
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果是流式响应（例如 SSE 或文件下载），直接透传，不包装 JSON 结构
        const response = context.switchToHttp().getResponse();
        if (response.headersSent || response.getHeader('content-type')?.toString().includes('text/event-stream')) {
          return data;
        }

        return {
          code: 200,
          message: 'success',
          data: data !== undefined ? data : null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
