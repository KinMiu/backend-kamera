import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';
import { MqttService } from '@/mqtt/mqtt.service';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {}

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

      // Broadcast MQTT event to worker for immediate stream configuration
      await this.mqttService.publishUpsertCamera(device);

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

  async getAllDevices(userId?: string) {
    try {
      const data = await this.prisma.device.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
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

  async getAllDevicesForWorker() {
    try {
      const devices = await this.prisma.device.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const formatted = devices.map((d) => ({
        id: d.id,
        name: d.name,
        macAddress: d.macAddress,
        rtspEndpoint: d.rtspEndpoint,
        mediamtxEndpoint: d.mediamtxEndpoint,
        source_url: d.rtspEndpoint,
        target_url: d.mediamtxEndpoint || '',
        is_active: true,
        latitude: d.latitude,
        longitude: d.longitude,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));

      return {
        status: 'success',
        message: 'Success get devices data for worker',
        data: formatted,
      };
    } catch (error) {
      console.error('Error getting devices for worker:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getDeviceById(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
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
      },
    });

    if (!isValid) {
      throw new NotFoundException('Device not found');
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

      // Broadcast MQTT update to worker
      await this.mqttService.publishUpsertCamera(update);

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
      },
    });

    if (!isValid) {
      throw new NotFoundException('Device not found');
    }

    try {
      await this.prisma.device.delete({
        where: {
          id: deviceId,
        },
      });

      // Broadcast MQTT removal to worker
      await this.mqttService.publishRemoveCamera(deviceId);

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

  async captureDeviceSnapshot(deviceId: string): Promise<Buffer> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const streamUrl = device.mediamtxEndpoint || device.rtspEndpoint;
    if (!streamUrl) {
      throw new BadRequestException('Device does not have a valid stream URL');
    }

    const { spawn } = await import('child_process');

    return new Promise<Buffer>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-rtsp_transport',
        'tcp',
        '-i',
        streamUrl,
        '-frames:v',
        '1',
        '-f',
        'image2pipe',
        '-vcodec',
        'mjpeg',
        'pipe:1',
      ]);

      const chunks: Buffer[] = [];
      let errOutput = '';

      ffmpeg.stdout.on('data', (chunk) => {
        chunks.push(chunk);
      });

      ffmpeg.stderr.on('data', (data) => {
        errOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0 && chunks.length > 0) {
          resolve(Buffer.concat(chunks));
        } else {
          console.error(`FFmpeg snapshot failed with code ${code}: ${errOutput}`);
          reject(new InternalServerErrorException('Failed to capture snapshot from camera stream'));
        }
      });

      ffmpeg.on('error', (err) => {
        console.error('FFmpeg process error:', err);
        reject(new InternalServerErrorException('FFmpeg execution error'));
      });

      // 6 second safety timeout
      setTimeout(() => {
        try {
          ffmpeg.kill();
        } catch {
          // ignore
        }
        reject(new GatewayTimeoutException('Snapshot capture timed out'));
      }, 6000);
    });
  }
}
