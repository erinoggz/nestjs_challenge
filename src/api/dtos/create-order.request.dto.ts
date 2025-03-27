import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDTO {
  @ApiProperty({
    description: 'The ID of the record to order',
    example: '67e2bd1acfef117ac68a0a15',
    type: String,
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({
    description: 'Quantity of records to order',
    example: 1,
    minimum: 1,
    type: Number,
    required: true,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDTO {
  @ApiProperty({
    description: 'List of record items to order',
    type: [OrderItemDTO],
    example: [
      {
        recordId: '67e2bd1acfef117ac68a0a15',
        quantity: 1,
      },
    ],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  @IsNotEmpty()
  items: OrderItemDTO[];
}
