import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { RecordSchema } from './schemas/record.schema';
import { TrackListService } from './services/tracklist.service';
import { HttpModule } from '@nestjs/axios';
import { RedisCache } from '../lib/redis.cache';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
  ],
  controllers: [RecordController],
  providers: [RecordService, TrackListService, RedisService, RedisCache],
})
export class RecordModule {}
