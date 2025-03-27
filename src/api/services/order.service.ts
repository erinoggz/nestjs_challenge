import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { RecordService } from './record.service';
import { CreateOrderDTO } from '../dtos/create-order.request.dto';
import { OrderStatus } from '../common/enum/order.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly recordService: RecordService,
  ) {}

  async create(createOrderDto: CreateOrderDTO): Promise<Order> {
    try {
      let totalAmount = 0;
      const orderItems = [];

      for (const item of createOrderDto.items) {
        // stock check
        const record = await this.recordService.findById(item.recordId);

        if (record.qty < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for record ${record.artist} - ${record.album}. Available: ${record.qty}`,
          );
        }

        // add the items to the order
        orderItems.push({
          recordId: new Types.ObjectId(item.recordId),
          quantity: item.quantity,
          price: record.price,
        });

        totalAmount += record.price * item.quantity;
      }

      // create the order
      const order = await this.orderModel.create({
        items: orderItems,
        totalAmount,
        status: OrderStatus.PENDING,
      });

      // ppdate the stock quantities
      for (const item of createOrderDto.items) {
        await this.recordService.updateStock(item.recordId, -item.quantity);
      }

      return order;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnprocessableEntityException(
        `Failed to create order: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ created: -1 });
  }

  async findById(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
