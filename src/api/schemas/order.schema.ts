import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OrderItem, OrderItemSchema } from './orderitem.schema';
import { OrderStatus } from '../common/enum/order.enum';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
