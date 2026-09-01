import { PrismaService } from '@/prisma/prisma.service';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GetRecordingsQueryDto } from './dto/recordings.dto';

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRecordings(query: GetRecordingsQueryDto, userId?: string) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const skip = (page - 1) * limit;
      const sortBy = query.sortBy || 'createdAt';
      const order = query.order || 'desc';

      const where: any = {};

      if (query.deviceId) {
        where.deviceId = query.deviceId;
      }

      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          where.createdAt.lte = new Date(query.endDate);
        }
      }

      if (query.search && query.search.trim() !== '') {
        const search = query.search.trim();
        where.OR = [
          { path: { contains: search, mode: 'insensitive' } },
          { device: { name: { contains: search, mode: 'insensitive' } } },
          { device: { macAddress: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, recordings] = await Promise.all([
        this.prisma.recording.count({ where }),
        this.prisma.recording.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: order },
          include: {
            device: {
              select: {
                id: true,
                name: true,
                macAddress: true,
                mediamtxEndpoint: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        }),
      ]);

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
        device: r.device,
      }));

      return {
        message: 'Success get recordings data',
        data: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getRecordingById(id: string, userId?: string) {
    try {
      const recording = await this.prisma.recording.findUnique({
        where: { id },
        include: {
          device: {
            select: {
              id: true,
              name: true,
              macAddress: true,
              mediamtxEndpoint: true,
              latitude: true,
              longitude: true,
            },
          },
        },
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
        device: recording.device,
      };

      return {
        message: 'Success get recording detail',
        data: formatted,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error getting recording detail:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }
}
