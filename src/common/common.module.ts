import { Global, Module } from '@nestjs/common';
import { MessageService } from './services/message.service';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';

@Global()
@Module({
  providers: [
    MessageService,
    ResponseInterceptor,
    AllExceptionsFilter,
    HttpLoggerMiddleware,
  ],
  exports: [
    MessageService,
    ResponseInterceptor,
    AllExceptionsFilter,
    HttpLoggerMiddleware,
  ],
})
export class CommonModule {}
