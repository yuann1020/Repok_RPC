import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';

const DEFAULT_SLOW_REQUEST_MS = 750;

type HttpExceptionLike = {
  getStatus: () => number;
};

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpTiming');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const method = request.method;
    const path = this.getPathWithoutQuery(request);
    const slowThresholdMs = this.getSlowThresholdMs();
    let loggedError = false;

    return next.handle().pipe(
      catchError((error: unknown) => {
        loggedError = true;
        this.logRequest({
          method,
          path,
          statusCode: this.getErrorStatusCode(error, response),
          durationMs: Date.now() - startedAt,
          slowThresholdMs,
          isError: true,
        });

        return throwError(() => error);
      }),
      finalize(() => {
        if (loggedError) {
          return;
        }

        this.logRequest({
          method,
          path,
          statusCode: response.statusCode || 'unknown',
          durationMs: Date.now() - startedAt,
          slowThresholdMs,
          isError: false,
        });
      }),
    );
  }

  private logRequest(details: {
    method: string;
    path: string;
    statusCode: number | string;
    durationMs: number;
    slowThresholdMs: number;
    isError: boolean;
  }) {
    const label =
      details.durationMs >= details.slowThresholdMs ? 'HTTP_SLOW' : 'HTTP';
    const message = `${label} ${details.method} ${details.path} ${details.statusCode} ${details.durationMs}ms`;

    if (details.isError || details.durationMs >= details.slowThresholdMs) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private getPathWithoutQuery(request: Request) {
    const originalUrl =
      request.originalUrl || request.url || request.path || '';
    return originalUrl.split('?')[0] || '/';
  }

  private getErrorStatusCode(error: unknown, response: Response) {
    if (this.hasHttpStatus(error)) {
      return error.getStatus();
    }

    return response.statusCode || 500;
  }

  private hasHttpStatus(error: unknown): error is HttpExceptionLike {
    return (
      typeof error === 'object' &&
      error !== null &&
      typeof (error as Partial<HttpExceptionLike>).getStatus === 'function'
    );
  }

  private getSlowThresholdMs() {
    const configured = Number(process.env.SLOW_REQUEST_MS);

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_SLOW_REQUEST_MS;
    }

    return configured;
  }
}
