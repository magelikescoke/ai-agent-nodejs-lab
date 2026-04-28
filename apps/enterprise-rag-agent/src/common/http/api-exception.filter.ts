import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

interface ErrorLike {
  status?: number;
  message?: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = this.getStatus(exception);
    const errors = this.getErrors(exception);

    response.status(status).json({
      code: status,
      data: {},
      errors,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    const status = (exception as ErrorLike).status;

    return typeof status === 'number' ? status : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrors(exception: unknown): string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return [response];
      }

      if (typeof response === 'object' && response !== null && 'message' in response) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message : [message];
      }
    }

    const message = (exception as ErrorLike).message;

    return [message ?? 'Internal server error'];
  }
}
