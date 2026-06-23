import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditService } from '../../audit/audit.service';
import { resolveLocale, translateBackendMessage } from '../i18n/localization';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly auditService: AuditService) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { id?: string } }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = responseBody.message ?? message;
        error = responseBody.error ?? exception.name;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const locale = resolveLocale(request.headers['accept-language']);
    const localizedMessage = translateBackendMessage(message, locale);

    await this.auditService
      .log(
        request.user?.id,
        'http.exception',
        request.path,
        undefined,
        null,
        {
          statusCode: status,
          message: localizedMessage,
          error,
        },
        request.ip,
      )
      .catch(() => undefined);

    response.status(status).json({
      statusCode: status,
      message: localizedMessage,
      error,
    });
  }
}
