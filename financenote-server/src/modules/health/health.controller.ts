import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { Public } from '../../common/decorators/public.decorator';
import { DocumentService } from '../document/document.service';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource, private readonly config: ConfigService, private readonly documents: DocumentService) {}

  @Public()
  @Get()
  async check() {
    const checks: Record<string, string> = {};
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }
    if (this.config.get<string>('REDIS_URL')) {
      const redis = new IORedis(this.config.getOrThrow<string>('REDIS_URL'), { connectTimeout: 1000, maxRetriesPerRequest: 1 });
      try {
        await redis.ping();
        checks.redis = 'ok';
      } catch {
        checks.redis = 'error';
      } finally {
        await redis.quit().catch(() => undefined);
      }
    } else {
      checks.redis = 'disabled';
    }
    const queue = await this.documents.getQueueStats().catch(() => ({ pending: -1, active: -1, backend: 'memory' as const }));
    checks.queue = queue.backend;
    const healthy = checks.database === 'ok' && checks.redis !== 'error';
    return { status: healthy ? 'ok' : 'degraded', checks, queue, timestamp: new Date().toISOString() };
  }
}
