import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

import { RecordFormat, RecordCategory } from '../common/enum/record.enum';
import { ITrackList } from '../common/interface/tracklist.interface';

@Schema({ timestamps: true })
export class Record extends Document {
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified: Date;

  @Prop({ required: false })
  mbid?: string;

  @Prop({ default: [] })
  tracklist: ITrackList[];
}

export const RecordSchema = SchemaFactory.createForClass(Record);

// filter index
RecordSchema.index(
  { artist: 1, album: 1, format: 1, category: 1 },
  { unique: true },
);

// search index
RecordSchema.index(
  { artist: 'text', album: 'text' },
  {
    weights: {
      artist: 10,
      album: 5,
    },
    name: 'record_text_index',
  },
);
