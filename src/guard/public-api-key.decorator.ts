import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_API_KEY = 'isPublicApiKey';
export const PublicApiKey = () => SetMetadata(IS_PUBLIC_API_KEY, true);
