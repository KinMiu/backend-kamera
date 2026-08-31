import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeviceDto {
  @IsNotEmpty({ message: 'Name cannot be empty!' })
  @IsString({ message: 'Name must be a string!' })
  name!: string;

  @IsNotEmpty({ message: 'MAC Address cannot be empty!' })
  @IsString({ message: 'MAC Address must be a string!' })
  macAddress!: string;

  @IsNotEmpty({ message: 'RTSP Endpoint cannot be empty!' })
  @IsString({ message: 'RTSP Endpoint must be a string!' })
  rtspEndpoint!: string;

  @IsOptional()
  @IsString({ message: 'MediaMTX Endpoint must be a string!' })
  mediamtxEndpoint?: string;

  // Alias support for MediaMTX bypass RTSP link
  @IsOptional()
  @IsString({ message: 'MediaMTX RTSP Endpoint must be a string!' })
  mediamtxRtspEndpoint?: string;

  @IsOptional()
  @IsString({ message: 'Bypass RTSP Endpoint must be a string!' })
  bypassRtspEndpoint?: string;

  @IsOptional()
  @IsString({ message: 'MediaMTX URL must be a string!' })
  mediamtxUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a number!' })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a number!' })
  longitude?: number;

  // Alias support for lat & long
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Lat must be a number!' })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Long must be a number!' })
  long?: number;
}

export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}
