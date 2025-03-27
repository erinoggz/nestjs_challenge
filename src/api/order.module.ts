import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { OrderSchema } from './schemas/order.schema';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { RecordService } from './services/record.service';
import { RedisCache } from 'src/lib/redis.cache';
import { RedisService } from './services/redis.service';
import { TrackListService } from './services/tracklist.service';
import { RecordSchema } from './schemas/record.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Record', schema: RecordSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    RecordService,
    TrackListService,
    RedisService,
    RedisCache,
  ],
})
export class OrderModule {}
