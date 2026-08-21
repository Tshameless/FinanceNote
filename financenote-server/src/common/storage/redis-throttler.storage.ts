import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
}
import IORedis from 'ioredis';

/** Redis-backed counter shared by all API instances. */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnApplicationShutdown {
  private readonly client: IORedis;

  constructor(redisUrl: string) {
    this.client = new IORedis(redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const redisKey = `financenote:throttle:${key}`;
    const count = await this.client.incr(redisKey);
    if (count === 1) await this.client.pexpire(redisKey, ttl);
    const remaining = await this.client.pttl(redisKey);
    return {
      totalHits: count,
      timeToExpire: Math.max(1, Math.ceil(Math.max(remaining, 0) / 1000)),
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
