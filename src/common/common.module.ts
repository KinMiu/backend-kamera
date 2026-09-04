import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MessageService } from './services/message.service';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';

@Global()
@Module({
  providers: [
    MessageService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    HttpLoggerMiddleware,
  ],
  exports: [MessageService, HttpLoggerMiddleware],
})
export class CommonModule {}
