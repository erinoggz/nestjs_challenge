import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import * as redisStore from 'cache-manager-redis-store';

import { RecordModule } from './api/record.module';
import { AppConfig } from './app.config';
import { OrderModule } from './api/order.module';

@Module({
  imports: [
    MongooseModule.forRoot(AppConfig.mongoUrl),
    RecordModule,
    OrderModule,
    CacheModule.register({
      store: redisStore,
      host: AppConfig.redis.host,
      port: AppConfig.redis.port,
      database: AppConfig.redis.db,
      ttl: 172800,
      max: 300000,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
