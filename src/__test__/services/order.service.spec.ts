import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../../api/services/order.service';
import { RecordService } from '../../api/services/record.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../../api/schemas/order.schema';
import { CreateOrderDTO } from '../../api/dtos/create-order.request.dto';
import { OrderStatus } from '../../api/common/enum/order.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrderService', () => {
  let orderService: OrderService;
  let recordService: RecordService;
  let orderModel: Model<Order>;

  const mockOrders = [
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

  const mockOrderModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue(mockOrders),
    }),
    findById: jest.fn(),
  };

  const mockRecordService = {
    findById: jest.fn(),
    updateStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: RecordService,
          useValue: mockRecordService,
        },
        {
          provide: getModelToken('Order'),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    recordService = module.get<RecordService>(RecordService);
    orderModel = module.get<Model<Order>>(getModelToken('Order'));
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
    expect(recordService).toBeDefined();
    expect(orderModel).toBeDefined();
  });

  it('should create a new order and update stock', async () => {
    const createOrderDto: CreateOrderDTO = {
      items: [
        { recordId: '60d21b4667d0d8992e610c85', quantity: 2 },
        { recordId: '60d21b4667d0d8992e610c86', quantity: 1 },
      ],
    };

    const mockRecords = [
      {
        _id: '60d21b4667d0d8992e610c85',
        price: 25.99,
        qty: 10,
        artist: 'Artist1',
        album: 'Album1',
      },
      {
        _id: '60d21b4667d0d8992e610c86',
        price: 19.99,
        qty: 5,
        artist: 'Artist2',
        album: 'Album2',
      },
    ];

    mockRecordService.findById.mockImplementation((id) =>
      Promise.resolve(mockRecords.find((record) => record._id === id)),
    );

    const expectedOrder = {
      _id: '60d21b4667d0d8992e610c89',
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
    };

    mockOrderModel.create.mockResolvedValue(expectedOrder);

    const result = await orderService.create(createOrderDto);

    expect(result).toEqual(expectedOrder);
    expect(recordService.findById).toHaveBeenCalledTimes(2);
    expect(recordService.updateStock).toHaveBeenCalledTimes(2);
    expect(recordService.updateStock).toHaveBeenCalledWith(
      '60d21b4667d0d8992e610c85',
      -2,
    );
    expect(recordService.updateStock).toHaveBeenCalledWith(
      '60d21b4667d0d8992e610c86',
      -1,
    );
    expect(mockOrderModel.create).toHaveBeenCalledWith({
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
    });
  });

  it('should throw BadRequestException if there is not enough stock', async () => {
    const createOrderDto: CreateOrderDTO = {
      items: [{ recordId: '60d21b4667d0d8992e610c85', quantity: 22 }],
    };

    await expect(orderService.create(createOrderDto)).rejects.toThrow(
      BadRequestException,
    );

    expect(recordService.updateStock).toHaveBeenCalled();
    expect(mockOrderModel.create).toHaveBeenCalled();
  });

  it('should return all orders', async () => {
    const result = await orderService.findAll();
    expect(result).toEqual(mockOrders);
    expect(mockOrderModel.find).toHaveBeenCalled();
  });

  it('should throw NotFoundException if order not found', async () => {
    const orderId = 'non-existent-id';
    await expect(orderService.findById(orderId)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockOrderModel.findById).toHaveBeenCalledWith(orderId);
  });
});
