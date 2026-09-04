import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../database/entities/user.entity';
import { JwtPayload } from '../common/interfaces/request.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
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
          expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
        }),
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_REFRESH_SECRET || 'secret-refresh-key-2026',
          expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
        }),
      ]);

      return { accessToken, refreshToken };
    } catch {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string | null) {
    try {
      if (!refreshToken) {
        await this.userRepository.update({ id: userId }, { refreshToken: null });
        return;
      }

      const hash = await bcrypt.hash(refreshToken, 10);
      await this.userRepository.update({ id: userId }, { refreshToken: hash });
    } catch {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
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
    } catch {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let userId: string;
    try {
      const decoded = this.jwtService.decode(refreshToken) as JwtPayload | null;
      userId = decoded?.id ?? '';
    } catch {
      throw new UnauthorizedException('Invalid token format');
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied, refresh token has been revoked');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Access denied, invalid refresh token');
    }

    try {
      const tokens = await this.generateTokens(user.id, user.email, user.name);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch {
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
    } catch {
      throw new InternalServerErrorException(
        'Something went wrong on our server',
      );
    }
  }
}
