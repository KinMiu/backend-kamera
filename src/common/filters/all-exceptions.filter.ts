import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

interface HttpExceptionResponseObject {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface DatabaseDriverError {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // 1. Check for TypeORM / PostgreSQL Unique Constraint Violation (Error code 23505 -> 409 Conflict)
    const dbDriverError =
      exception && typeof exception === 'object' && 'driverError' in exception
        ? (exception as { driverError?: DatabaseDriverError }).driverError
        : undefined;

    if (dbDriverError?.code === '23505') {
      httpStatus = HttpStatus.CONFLICT;
      message =
        dbDriverError.detail ||
        'Duplicate entry error: Data with this unique value already exists';
    } else if (exception instanceof HttpException) {
      // 2. Standard NestJS HttpExceptions (400, 401, 403, 404, 409, 500, etc.)
      httpStatus = exception.getStatus();
      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        message = responseData;
      } else if (typeof responseData === 'object' && responseData !== null) {
        const resObj = responseData as HttpExceptionResponseObject;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(', ');
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else {
          message = exception.message;
        }
      }
    } else if (exception instanceof Error) {
      // 3. General Uncaught Error
      message = exception.message;
    }

    if (httpStatus >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `Exception on ${httpAdapter.getRequestUrl(request)}: ${stack}`,
      );
    }

    const responseBody = {
      code: httpStatus,
      status: false,
      message: message,
      path: httpAdapter.getRequestUrl(request),
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
