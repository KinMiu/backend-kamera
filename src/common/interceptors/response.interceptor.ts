import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import {
  IResponseEntity,
  IServiceMessageResponse,
} from '../interfaces/response.interface';
import { MessageService } from '../services/message.service';

@Injectable()
export class ResponseInterceptor<T = unknown> implements NestInterceptor<
  T,
  IResponseEntity<T> | T
> {
  constructor(private readonly messageService?: MessageService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IResponseEntity<T> | T> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((res: unknown) => {
        // If response was directly handled (e.g. Binary / Image Buffer snapshot)
        if (response.headersSent || Buffer.isBuffer(res)) {
          return res as T;
        }

        let message = 'Successfully retrieve data';
        if (this.messageService && this.messageService.getMessage()) {
          message = this.messageService.getMessage();
        } else if (
          res !== null &&
          typeof res === 'object' &&
          'message' in res &&
          typeof res.message === 'string' &&
          !Array.isArray(res)
        ) {
          message = (res as { message: string }).message;
        }

        const formattedResponse: IResponseEntity<T> = {
          code: response.statusCode || 200,
          status: true,
          message: message,
        };

        if (res !== undefined && res !== null) {
          if (Array.isArray(res)) {
            formattedResponse.data = res as unknown as T;
          } else if (
            typeof res === 'object' &&
            'meta' in res &&
            'data' in res
          ) {
            const pageRes = res as IServiceMessageResponse<T>;
            formattedResponse.data = pageRes.data;
            formattedResponse.meta = pageRes.meta;
          } else if (
            typeof res === 'object' &&
            'data' in res &&
            'message' in res
          ) {
            formattedResponse.data = (res as IServiceMessageResponse<T>).data;
          } else {
            formattedResponse.data = res as T;
          }
        }

        return formattedResponse;
      }),
    );
  }
}
