import { PrismaService } from '@/prisma/prisma.service';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async createDevice(dto: CreateDeviceDto, userId: string) {
    try {
      const latitude = dto.latitude ?? dto.lat ?? null;
      const longitude = dto.longitude ?? dto.long ?? null;
      const mediamtxEndpoint =
        dto.mediamtxEndpoint ??
        dto.mediamtxRtspEndpoint ??
        dto.bypassRtspEndpoint ??
        dto.mediamtxUrl ??
        null;

      const device = await this.prisma.device.create({
        data: {
          userId: userId,
          name: dto.name,
          macAddress: dto.macAddress,
          rtspEndpoint: dto.rtspEndpoint,
          mediamtxEndpoint: mediamtxEndpoint,
          latitude: latitude,
          longitude: longitude,
        },
      });

      return {
        message: 'Success created device',
        data: device,
      };
    } catch (error) {
      console.error('Error creating device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getAllDevices(userId: string) {
    try {
      const data = await this.prisma.device.findMany({
        where: { userId: userId },
      });

      return {
        message: 'Success get devices data',
        data: data,
      };
    } catch (error) {
      console.error('Error getting devices:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getDeviceById(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found or access denied');
    }

    return {
      message: 'Success get device detail',
      data: device,
    };
  }

  async updateDevice(dto: UpdateDeviceDto, userId: string, deviceId: string) {
    const isValid = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: userId,
      },
    });

    if (!isValid) {
      throw new UnauthorizedException('Device not found or access denied');
    }

    try {
      const latValue = dto.latitude !== undefined ? dto.latitude : dto.lat;
      const longValue = dto.longitude !== undefined ? dto.longitude : dto.long;
      const mediamtxValue =
        dto.mediamtxEndpoint ??
        dto.mediamtxRtspEndpoint ??
        dto.bypassRtspEndpoint ??
        dto.mediamtxUrl;

      const update = await this.prisma.device.update({
        where: {
          id: deviceId,
        },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.macAddress && { macAddress: dto.macAddress }),
          ...(dto.rtspEndpoint && { rtspEndpoint: dto.rtspEndpoint }),
          ...(mediamtxValue !== undefined && {
            mediamtxEndpoint: mediamtxValue,
          }),
          ...(latValue !== undefined && { latitude: latValue }),
          ...(longValue !== undefined && { longitude: longValue }),
        },
      });

      return {
        message: 'Success update device',
        data: update,
      };
    } catch (error) {
      console.error('Error updating device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async deleteDevice(userId: string, deviceId: string) {
    const isValid = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: userId,
      },
    });

    if (!isValid) {
      throw new UnauthorizedException('Device not found or access denied');
    }

    try {
      await this.prisma.device.delete({
        where: {
          id: deviceId,
        },
      });

      return {
        message: 'Success delete device',
        id: deviceId,
      };
    } catch (error) {
      console.error('Error deleting device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }
}
