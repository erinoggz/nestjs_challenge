import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from '../../api/controllers/record.controller';
import { getModelToken } from '@nestjs/mongoose';
import { CreateRecordRequestDTO } from '../../api/dtos/create-record.request.dto';
import { TrackListService } from '../../api/services/tracklist.service';
import { HttpModule } from '@nestjs/axios';
import { RecordService } from '../../api/services/record.service';
import { RedisService } from '../../api/services/redis.service';
import { RedisCache } from '../../lib/redis.cache';
import { Record } from '../../api/schemas/record.schema';
import { Model } from 'mongoose';
import {
  RecordCategory,
  RecordFormat,
} from '../../api/common/enum/record.enum';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordService: RecordService;
  let recordModel: Model<Record>;

  const mockTrackListService = {
    fetchReleaseInformation: jest.fn(),
  };

  const mockRedisService = {
    read: jest.fn(),
    write: jest.fn(),
  };

  const mockRedisCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(0),
    deleteByPattern: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [RecordController],
      providers: [
        RecordService,
        {
          provide: TrackListService,
          useValue: mockTrackListService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RedisCache,
          useValue: mockRedisCache,
        },
        {
          provide: getModelToken('Record'),
          useValue: recordModel,
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordService = module.get<RecordService>(RecordService);
    recordModel = module.get<Model<Record>>(getModelToken('Record'));
  });

  it('should be defined', () => {
    expect(recordController).toBeDefined();
    expect(recordService).toBeDefined();
  });

  it('should create a new record', async () => {
    const createRecordDto: CreateRecordRequestDTO = {
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    const savedRecord = {
      _id: '1',
      artist: 'Test',
      album: 'Test Record',
      price: 100,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ALTERNATIVE,
    };

    jest.spyOn(recordService, 'create').mockResolvedValue(savedRecord as any);

    const result = await recordController.create(createRecordDto);
    expect(result).toEqual(savedRecord);
    expect(recordService.create).toHaveBeenCalledWith(createRecordDto);
  });

  it('should return an array of records', async () => {
    const records = [
      { _id: '1', artist: 'Artist 1', album: 'Album 1', price: 100, qty: 10 },
      { _id: '2', artist: 'Artist 2', album: 'Album 2', price: 200, qty: 20 },
    ];

    const mockResponse = {
      data: records,
      total: 2,
      page: 1,
      pages: 1,
    };

    jest.spyOn(recordService, 'findAll').mockResolvedValue(mockResponse as any);

    const result = await recordController.findAll();
    expect(result).toEqual(mockResponse);
    expect(recordService.findAll).toHaveBeenCalled();
  });

  it('should search by incomplte album name or incomplete artist name', async () => {
    const filteredRecords = [
      {
        _id: '1',
        artist: 'Pink Floyd',
        album: 'Dark Side of the Moon',
        price: 30,
        qty: 5,
      },
    ];

    const mockResponse = {
      data: filteredRecords,
      total: 1,
      page: 1,
      pages: 1,
    };

    jest.spyOn(recordService, 'findAll').mockResolvedValue(mockResponse as any);

    const result = await recordController.findAll(
      'pink',
      undefined,
      undefined,
      undefined,
      undefined,
      '1',
      '10',
    );

    expect(result).toEqual(mockResponse);
    expect(recordService.findAll).toHaveBeenCalledWith({
      q: 'pink',
      page: 1,
      limit: 10,
    });
  });

  it('should filter records by artist name', async () => {
    const filteredRecords = [
      {
        _id: '1',
        artist: 'Pink Floyd',
        album: 'Dark Side of the Moon',
        price: 30,
        qty: 5,
      },
    ];

    const mockResponse = {
      data: filteredRecords,
      total: 1,
      page: 1,
      pages: 1,
    };

    jest.spyOn(recordService, 'findAll').mockResolvedValue(mockResponse as any);

    const result = await recordController.findAll(
      undefined,
      'Pink Floyd',
      undefined,
      undefined,
      undefined,
      '1',
      '10',
    );

    expect(result).toEqual(mockResponse);
    expect(recordService.findAll).toHaveBeenCalledWith({
      artist: 'Pink Floyd',
      page: 1,
      limit: 10,
    });
  });
});
