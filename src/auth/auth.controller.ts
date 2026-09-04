import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Body() body: Record<string, any>,
    @Req() req: AuthenticatedRequest,
  ) {
    const authHeader = req.headers?.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    const token =
      body?.refreshToken ||
      body?.refresh_token ||
      bearerToken;

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshTokens(token);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.authService.logout(userId);
  }
}
