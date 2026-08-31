/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '@/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async generateTokens(userId: string, email: string, name: string) {
    try {
      const payload = {
        id: userId,
        email,
        name,
      };

      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_SECRET || 'secret-access-key-2026',
          expiresIn: '15m',
        }),
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_REFRESH_SECRET || 'secret-refresh-key-2026',
          expiresIn: '7d',
        }),
      ]);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string | null) {
    try {
      if (!refreshToken) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            refreshToken: null,
          },
        });
        return;
      }

      const hash = await bcrypt.hash(refreshToken, 10);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: hash,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name);

    try {
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return {
        message: 'Welcome to The Destroyer',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new ForbiddenException('Access denied, missing tokens or payload');
    }

    let userId: string;

    try {
      const decoded = this.jwtService.decode(refreshToken) as any;
      userId = decoded?.id;
    } catch (error) {
      throw new ForbiddenException('Invalid token format');
    }

    if (!userId) {
      throw new ForbiddenException('Access denied, invalid payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Access denied, Token not valid !');
    }

    try {
      const tokens = await this.generateTokens(user.id, user.email, user.name);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
      // console.log(tokens);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong on our server during token generation',
      );
    }
  }

  async logout(userId: string) {
    try {
      await this.updateRefreshTokenHash(userId, null);
      return {
        message: 'Success logout!',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }
}
