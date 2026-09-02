import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecordingsQueryDto {
  @IsOptional()
  @IsString({ message: 'deviceId must be a string' })
  deviceId?: string;

  @IsOptional()
  @IsString({ message: 'startDate must be a valid date string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'endDate must be a valid date string' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'search must be a string' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'duration', 'size', 'path'], {
    message: 'sortBy must be one of: createdAt, duration, size, path',
  })
  sortBy?: string = 'path';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], {
    message: 'order must be either asc or desc',
  })
  order?: 'asc' | 'desc' = 'desc';
}
