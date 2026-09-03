import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { GetRecordingsQueryDto } from './dto/recordings.dto';
import { JwtAuthGuard } from '@/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '@/common/interfaces/request.interface';

@UseGuards(JwtAuthGuard)
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  async getAll(
    @Query() query: GetRecordingsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    return this.recordingsService.getAllRecordings(query, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('get')
  async getAllAlias(
    @Query() query: GetRecordingsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    return this.recordingsService.getAllRecordings(query, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('device/:deviceId')
  async getByDevice(
    @Param('deviceId') deviceId: string,
    @Query() query: GetRecordingsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    return this.recordingsService.getAllRecordings(
      { ...query, deviceId },
      userId,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id;
    return this.recordingsService.getRecordingById(id, userId);
  }
}
