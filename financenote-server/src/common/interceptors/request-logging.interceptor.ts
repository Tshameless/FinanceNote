import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string; user?: { id?: number } }>();
    const response = context.switchToHttp().getResponse<Response>();
    const started = Date.now();
    return next.handle().pipe(tap({
      next: () => this.write(request, response, started),
      error: () => this.write(request, response, started),
    }));
  }

  private write(request: Request & { requestId?: string; user?: { id?: number } }, response: Response, started: number): void {
    this.logger.log(JSON.stringify({
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Date.now() - started,
      userId: request.user?.id,
    }));
  }
}
