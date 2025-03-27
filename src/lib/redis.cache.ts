import { RedisService } from '../api/services/redis.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisCache {
  constructor(private readonly redisClient: RedisService) {}

  get(key: any) {
    return this.redisClient
      .read()
      .get(key)
      .then((data: string) => {
        return data ? JSON.parse(data) : '';
      });
  }

  set(key: any, value: any, ttl?: string) {
    if (ttl) {
      ttl = ttl;
      this.redisClient.write().set(key, JSON.stringify(value), 'ex', ttl);
    } else {
      this.redisClient.write().set(key, JSON.stringify(value));
    }
  }

  delete(key: any) {
    return this.redisClient.write().del(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.redisClient.read().keys(pattern);

    if (keys && keys.length > 0) {
      return this.delete(keys);
    }

    return 0;
  }
}
