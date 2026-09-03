import { initializeTransactionalContext } from 'typeorm-transactional';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { MessageService } from './common/services/message.service';

async function bootstrap() {
  // Initialize typeorm-transactional context (LSKK Section 1)
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);

  // Centralized Exception Filter (LSKK Section 2)
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // Response Wrapper Interceptor (LSKK Section 4)
  const messageService = app.get(MessageService);
  app.useGlobalInterceptors(new ResponseInterceptor(messageService));

  // CORS Configuration (LSKK Section 1)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // DTO Validation Pipe (LSKK Section 1)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

bootstrap();
