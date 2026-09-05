import {
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';
import { MqttService } from '@/mqtt/mqtt.service';
import { DeviceEntity } from '../database/entities/device.entity';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
    private readonly mqttService: MqttService,
  ) {}

  async createDevice(dto: CreateDeviceDto, userId: string) {
    try {
      let macAddress = dto.macAddress?.trim();

      if (macAddress) {
        // 409 Conflict check for unique MAC address if provided
        const existing = await this.deviceRepository.findOne({
          where: { macAddress },
        });
        if (existing) {
          throw new ConflictException(
            `Device with MAC address '${macAddress}' already exists`,
          );
        }
      } else {
        // Auto-generate virtual MAC (02:1A:XX:XX:XX:XX) if omitted
        const randHex = Array.from({ length: 4 }, () =>
          Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase(),
        ).join(':');
        macAddress = `02:1A:${randHex}`;
      }

      const latitude = dto.latitude ?? dto.lat ?? null;
      const longitude = dto.longitude ?? dto.long ?? null;
      const mediamtxEndpoint =
        dto.mediamtxEndpoint ??
        dto.mediamtxRtspEndpoint ??
        dto.bypassRtspEndpoint ??
        dto.mediamtxUrl ??
        null;

      const device = this.deviceRepository.create({
        userId: userId,
        name: dto.name,
        macAddress: macAddress,
        rtspEndpoint: dto.rtspEndpoint,
        mediamtxEndpoint: mediamtxEndpoint,
        latitude: latitude,
        longitude: longitude,
      });

      const savedDevice = await this.deviceRepository.save(device);

      // Broadcast MQTT event to worker for immediate stream configuration
      await this.mqttService.publishUpsertCamera(savedDevice);

      return {
        message: 'Success created device',
        data: savedDevice,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error creating device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getAllDevices(userId?: string) {
    try {
      const data = await this.deviceRepository.find({
        order: { createdAt: 'DESC' },
        relations: { user: true },
        select: {
          id: true,
          name: true,
          macAddress: true,
          rtspEndpoint: true,
          mediamtxEndpoint: true,
          latitude: true,
          longitude: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            id: true,
            name: true,
            email: true,
          },
        },
      });

      return {
        message: 'Success get devices data',
        data: data,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting devices:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getAllDevicesForWorker() {
    try {
      const devices = await this.deviceRepository.find({
        order: { createdAt: 'DESC' },
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
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting devices for worker:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async getDeviceById(userId: string, deviceId: string) {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
      relations: { user: true },
      select: {
        id: true,
        name: true,
        macAddress: true,
        rtspEndpoint: true,
        mediamtxEndpoint: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          id: true,
          name: true,
          email: true,
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
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    try {
      // 409 Conflict check if changing to another existing MAC address
      if (dto.macAddress && dto.macAddress !== device.macAddress) {
        const existing = await this.deviceRepository.findOne({
          where: { macAddress: dto.macAddress },
        });
        if (existing && existing.id !== deviceId) {
          throw new ConflictException(
            `Device with MAC address '${dto.macAddress}' already exists`,
          );
        }
      }

      const latValue = dto.latitude !== undefined ? dto.latitude : dto.lat;
      const longValue = dto.longitude !== undefined ? dto.longitude : dto.long;
      const mediamtxValue =
        dto.mediamtxEndpoint ??
        dto.mediamtxRtspEndpoint ??
        dto.bypassRtspEndpoint ??
        dto.mediamtxUrl;

      if (dto.name !== undefined) device.name = dto.name;
      if (dto.macAddress !== undefined) device.macAddress = dto.macAddress;
      if (dto.rtspEndpoint !== undefined) device.rtspEndpoint = dto.rtspEndpoint;
      if (mediamtxValue !== undefined) device.mediamtxEndpoint = mediamtxValue;
      if (latValue !== undefined) device.latitude = latValue;
      if (longValue !== undefined) device.longitude = longValue;

      const updated = await this.deviceRepository.save(device);

      // Broadcast MQTT update to worker
      await this.mqttService.publishUpsertCamera(updated);

      return {
        message: 'Success update device',
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error updating device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async deleteDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    try {
      await this.deviceRepository.delete({ id: deviceId });

      // Broadcast MQTT removal to worker
      await this.mqttService.publishRemoveCamera(deviceId);

      return {
        message: 'Success delete device',
        data: { id: deviceId },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error deleting device:', error);
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async captureDeviceSnapshot(deviceId: string): Promise<Buffer> {
    const device = await this.deviceRepository.findOne({
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
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

    return new Promise<Buffer>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath, [
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
          this.logger.error(
            `FFmpeg snapshot failed with code ${code}: ${errOutput}`,
          );
          reject(
            new InternalServerErrorException(
              'Failed to capture snapshot from camera stream',
            ),
          );
        }
      });

      ffmpeg.on('error', (err: NodeJS.ErrnoException) => {
        this.logger.error('FFmpeg process error:', err);
        if (err?.code === 'ENOENT') {
          reject(
            new InternalServerErrorException(
              `FFmpeg binary ('${ffmpegPath}') tidak ditemukan di server. Pastikan ffmpeg sudah terinstall.`,
            ),
          );
        } else {
          reject(new InternalServerErrorException('FFmpeg execution error'));
        }
      });

      // 6-second timeout
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
