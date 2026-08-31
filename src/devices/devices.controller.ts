import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';
import { JwtAuthGuard } from '@/guard/jwt-auth.guard';
import { Public } from '@/guard/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('worker')
  async getWorkerDevices() {
    return this.devicesService.getAllDevicesForWorker();
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('worker/cameras')
  async getWorkerCamerasAlias() {
    return this.devicesService.getAllDevicesForWorker();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(@Body() dto: CreateDeviceDto, @Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.createDevice(dto, userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  async createAlias(@Body() dto: CreateDeviceDto, @Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.createDevice(dto, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getAll(@Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.getAllDevices(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get')
  async getAllAlias(@Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.getAllDevices(userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getById(@Param('id') deviceId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.getDeviceById(userId, deviceId);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async update(
    @Param('id') deviceId: string,
    @Body() dto: UpdateDeviceDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.devicesService.updateDevice(dto, userId, deviceId);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('update/:id')
  async updateAlias(
    @Param('id') deviceId: string,
    @Body() dto: UpdateDeviceDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.devicesService.updateDevice(dto, userId, deviceId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async delete(@Param('id') deviceId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.deleteDevice(userId, deviceId);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('delete/:id')
  async deleteAlias(@Param('id') deviceId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.devicesService.deleteDevice(userId, deviceId);
  }
}
