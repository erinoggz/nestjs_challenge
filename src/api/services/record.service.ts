import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { TrackListService } from './tracklist.service';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordCategory, RecordFormat } from '../common/enum/record.enum';
import { Record } from '../schemas/record.schema';
import { MONGO_ERROR_CODES } from '../..//helpers/constants';
import { RedisCache } from '../../lib/redis.cache';

@Injectable()
export class RecordService {
  constructor(
    private readonly trackListService: TrackListService,
    private readonly redisCache: RedisCache,
    @InjectModel('Record') private readonly recordModel: Model<Record>,
  ) {}
  async create(createRecordDto: CreateRecordRequestDTO): Promise<Record> {
    try {
      const recordData: any = {
        artist: createRecordDto.artist,
        album: createRecordDto.album,
        price: createRecordDto.price,
        qty: createRecordDto.qty,
        format: createRecordDto.format,
        category: createRecordDto.category,
        mbid: createRecordDto.mbid,
        tracklist: [],
      };

      if (createRecordDto.mbid) {
        try {
          const mbData = await this.trackListService.fetchReleaseByMbid(
            createRecordDto.mbid,
          );
          recordData.tracklist = mbData.tracklist;
        } catch (error) {
          console.error('MusicBrainz fetch failed:', error.message);
          throw error;
        }
      }

      return await this.recordModel.create(recordData);
    } catch (error) {
      if (error.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
        throw new ForbiddenException(
          'Record already exists with this artist, album, and format combination',
        );
      }
      throw new UnprocessableEntityException(
        `Failed to create record: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    try {
      const existingRecord = await this.recordModel.findById(
        new Types.ObjectId(id),
      );
      if (!existingRecord) {
        throw new NotFoundException('Record not found');
      }

      const mbidChanged =
        updateRecordDto.mbid && updateRecordDto.mbid !== existingRecord.mbid;

      if (mbidChanged) {
        try {
          const mbData = await this.trackListService.fetchReleaseByMbid(
            updateRecordDto.mbid,
          );
          updateRecordDto.tracklist = mbData.tracklist;
        } catch (error) {
          console.error(
            'MusicBrainz fetch failed during update:',
            error.message,
          );
        }
      }

      const updatedRecord = await this.recordModel.findByIdAndUpdate(
        id,
        { ...updateRecordDto, lastModified: new Date() },
        { new: true, runValidators: true },
      );
      await this.invalidateCache();
      return updatedRecord;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error.code === MONGO_ERROR_CODES.DUPLICATE_KEY) {
        throw new ForbiddenException(
          'Record already exists with this artist, album, and format combination',
        );
      }
      throw new UnprocessableEntityException(
        `Failed to update record: ${error.message}`,
      );
    }
  }

  async findAll(filters: {
    q?: string;
    artist?: string;
    album?: string;
    format?: RecordFormat;
    category?: RecordCategory;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Record[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const {
        q,
        artist,
        album,
        format,
        category,
        page = 1,
        limit = 10,
      } = filters;

      const cacheKey = `records:${q || ''}:${artist || ''}:${album || ''}:${format || ''}:${category || ''}:${page}:${limit}`;

      const cachedResult = await this.redisCache.get(cacheKey);

      if (cachedResult) {
        Logger.log('reading from redis');
        return JSON.parse(cachedResult);
      }

      const skip = (page - 1) * limit;
      const query: any = {};

      if (q) {
        query.$or = [
          { artist: { $regex: q, $options: 'i' } },
          { album: { $regex: q, $options: 'i' } },
        ];
      }

      if (artist) {
        query.artist = { $regex: artist, $options: 'i' };
      }

      if (album) {
        query.album = { $regex: album, $options: 'i' };
      }

      if (format) {
        query.format = format;
      }

      if (category) {
        query.category = category;
      }

      const total = await this.recordModel.countDocuments(query);

      const data = await this.recordModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ lastModified: 'asc' });

      const result = {
        total,
        page,
        pages: Math.ceil(total / limit),
        data,
      };

      await this.redisCache.set(cacheKey, JSON.stringify(result));

      return result;
    } catch (error) {
      throw new UnprocessableEntityException(
        `Failed to fetch records: ${error.message}`,
      );
    }
  }

  async findById(id: string): Promise<Record> {
    try {
      const record = await this.recordModel.findById(id);
      if (!record) {
        throw new NotFoundException('Record not found');
      }
      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnprocessableEntityException(
        `Failed to fetch record: ${error.message}`,
      );
    }
  }

  async updateStock(id: string, quantityChange: number): Promise<Record> {
    const record = await this.findById(id);
    const newQty = Math.max(0, record.qty + quantityChange);

    return await this.recordModel.findByIdAndUpdate(
      id,
      { qty: newQty, lastModified: new Date() },
      { new: true },
    );
  }

  async invalidateCache(): Promise<void> {
    try {
      await this.redisCache.deleteByPattern('records:*');
    } catch (error) {
      console.error('Failed to invalidate cache:', error.message);
    }
  }
}
