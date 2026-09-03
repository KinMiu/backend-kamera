import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { RecordingEntity } from '../database/entities/recording.entity';
import { DeviceEntity } from '../database/entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecordingEntity, DeviceEntity])],
  controllers: [RecordingsController],
  providers: [RecordingsService],
  exports: [RecordingsService],
})
export class RecordingsModule {}
