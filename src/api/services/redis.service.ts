import { Injectable } from '@nestjs/common';
import redisClient from 'ioredis';
import { AppConfig } from '../../app.config';

@Injectable()
export class RedisService {
  private static readConnection: any;
  private static writeConnection: any;

  read() {
    if (!RedisService.readConnection) {
      const readOptions: object = {
        host: AppConfig.redis.host,
        port: AppConfig.redis.port,
        db: AppConfig.redis.db,
      };
      RedisService.readConnection = new redisClient(readOptions);
    }
    return RedisService.readConnection;
  }

  write() {
    if (!RedisService.writeConnection) {
      const writeOptions: object = {
        host: AppConfig.redis.host,
        port: AppConfig.redis.port,
        db: AppConfig.redis.db,
      };
      RedisService.writeConnection = new redisClient(writeOptions);
    }
    return RedisService.writeConnection;
  }
}
