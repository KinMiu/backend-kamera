import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetRecordingsQueryDto } from './dto/recordings.dto';
import { RecordingEntity } from '../database/entities/recording.entity';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);

  constructor(
    @InjectRepository(RecordingEntity)
    private readonly recordingRepository: Repository<RecordingEntity>,
  ) {}

  async getAllRecordings(query: GetRecordingsQueryDto, userId?: string) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const skip = (page - 1) * limit;
      const sortBy = query.sortBy || 'createdAt';
      const order = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const qb = this.recordingRepository
        .createQueryBuilder('recording')
        .leftJoinAndSelect('recording.device', 'device');

      if (query.deviceId) {
        qb.andWhere('recording.deviceId = :deviceId', { deviceId: query.deviceId });
      }

      if (query.startDate) {
        qb.andWhere('recording.createdAt >= :startDate', {
          startDate: new Date(query.startDate),
        });
      }

      if (query.endDate) {
        qb.andWhere('recording.createdAt <= :endDate', {
          endDate: new Date(query.endDate),
        });
      }

      if (query.search && query.search.trim() !== '') {
        const search = `%${query.search.trim()}%`;
        qb.andWhere(
          '(recording.path ILIKE :search OR device.name ILIKE :search OR device.macAddress ILIKE :search)',
          { search },
        );
      }

      // Safe sorting column mapping
      const validSortColumns: Record<string, string> = {
        createdAt: 'recording.createdAt',
        path: 'recording.path',
        duration: 'recording.duration',
        size: 'recording.size',
      };
      const sortColumn = validSortColumns[sortBy] || 'recording.createdAt';

      qb.orderBy(sortColumn, order).skip(skip).take(limit);

      const [recordings, total] = await qb.getManyAndCount();

      const formatted = recordings.map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        deviceName: r.device?.name ?? '',
        macAddress: r.device?.macAddress ?? '',
        path: r.path,
        url: r.url,
        size: r.size !== null && r.size !== undefined ? Number(r.size) : null,
        duration: r.duration,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        device: r.device
          ? {
              id: r.device.id,
              name: r.device.name,
              macAddress: r.device.macAddress,
              mediamtxEndpoint: r.device.mediamtxEndpoint,
              latitude: r.device.latitude,
              longitude: r.device.longitude,
            }
          : undefined,
      }));

      return {
        message: 'Success get recordings data',
        data: formatted,
        meta: {
          page,
          limit,
          totalData: total,
          totalDataPerPage: formatted.length,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting recordings:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getRecordingById(id: string, userId?: string) {
    try {
      const recording = await this.recordingRepository.findOne({
        where: { id },
        relations: { device: true },
      });

      if (!recording) {
        throw new NotFoundException(`Recording with id '${id}' not found`);
      }

      const formatted = {
        id: recording.id,
        deviceId: recording.deviceId,
        deviceName: recording.device?.name ?? '',
        macAddress: recording.device?.macAddress ?? '',
        path: recording.path,
        url: recording.url,
        size:
          recording.size !== null && recording.size !== undefined
            ? Number(recording.size)
            : null,
        duration: recording.duration,
        createdAt: recording.createdAt,
        updatedAt: recording.updatedAt,
        device: recording.device
          ? {
              id: recording.device.id,
              name: recording.device.name,
              macAddress: recording.device.macAddress,
              mediamtxEndpoint: recording.device.mediamtxEndpoint,
              latitude: recording.device.latitude,
              longitude: recording.device.longitude,
            }
          : undefined,
      };

      return {
        message: 'Success get recording detail',
        data: formatted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error getting recording detail:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }
}
