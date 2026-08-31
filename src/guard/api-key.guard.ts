import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_API_KEY } from './public-api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_API_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerName = (
      process.env.API_KEY_HEADER || 'x-api-key'
    ).toLowerCase();

    // Express lowercases all request headers
    const rawApiKey = request.headers[headerName] as string | undefined;

    if (!rawApiKey) {
      throw new UnauthorizedException(
        `Missing '${headerName}' in request headers`,
      );
    }

    const configuredKeys = (process.env.API_KEYS || '')
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (configuredKeys.length === 0) {
      // If no API keys are configured, deny all requests for safety
      throw new UnauthorizedException('API Key system is not configured');
    }

    const isValid = configuredKeys.includes(rawApiKey.trim());

    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key provided');
    }

    return true;
  }
}
