import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../../api/controllers/order.controller';
import { OrderService } from '../../api/services/order.service';
import { getModelToken } from '@nestjs/mongoose';
import { RecordService } from '../../api/services/record.service';
import { CreateOrderDTO } from '../../api/dtos/create-order.request.dto';
import { OrderStatus } from '../../api/common/enum/order.enum';
import { Types } from 'mongoose';

describe('OrderController', () => {
  let orderController: OrderController;
  let orderService: OrderService;

  const mockOrderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const mockRecordService = {
    findById: jest.fn(),
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: RecordService,
          useValue: mockRecordService,
        },
        {
          provide: getModelToken('Order'),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    orderController = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(orderController).toBeDefined();
    expect(orderService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDTO = {
        items: [
          { recordId: '60d21b4667d0d8992e610c85', quantity: 2 },
          { recordId: '60d21b4667d0d8992e610c86', quantity: 1 },
        ],
      };

      const createdOrder = {
        _id: '60d21b4667d0d8992e610c87',
        items: [
          {
            recordId: new Types.ObjectId('60d21b4667d0d8992e610c85'),
            quantity: 2,
            price: 25.99,
          },
          {
            recordId: new Types.ObjectId('60d21b4667d0d8992e610c86'),
            quantity: 1,
            price: 19.99,
          },
        ],
        totalAmount: 71.97,
        status: OrderStatus.PENDING,
        created: new Date(),
      };

      mockOrderService.create.mockResolvedValue(createdOrder);

      const result = await orderController.create(createOrderDto);

      expect(result).toEqual(createdOrder);
      expect(orderService.create).toHaveBeenCalledWith(createOrderDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const orders = [
        {
          _id: '60d21b4667d0d8992e610c87',
          items: [
            {
              recordId: new Types.ObjectId('60d21b4667d0d8992e610c85'),
              quantity: 2,
              price: 25.99,
            },
          ],
          totalAmount: 51.98,
          status: OrderStatus.PENDING,
          created: new Date(),
        },
        {
          _id: '60d21b4667d0d8992e610c88',
          items: [
            {
              recordId: new Types.ObjectId('60d21b4667d0d8992e610c86'),
              quantity: 1,
              price: 19.99,
            },
          ],
          totalAmount: 19.99,
          status: OrderStatus.COMPLETED,
          created: new Date(),
        },
      ];

      mockOrderService.findAll.mockResolvedValue(orders);

      const result = await orderController.findAll();

      expect(result).toEqual(orders);
      expect(orderService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const orderId = '60d21b4667d0d8992e610c87';
      const order = {
        _id: orderId,
        items: [
          {
            recordId: new Types.ObjectId('60d21b4667d0d8992e610c85'),
            quantity: 2,
            price: 25.99,
          },
        ],
        totalAmount: 51.98,
        status: OrderStatus.PENDING,
        created: new Date(),
      };

      mockOrderService.findById.mockResolvedValue(order);

      const result = await orderController.findOne(orderId);

      expect(result).toEqual(order);
      expect(orderService.findById).toHaveBeenCalledWith(orderId);
    });
  });
});
