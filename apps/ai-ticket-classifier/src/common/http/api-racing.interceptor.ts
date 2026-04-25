import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { defer, firstValueFrom, from, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { API_TIMEOUT_METADATA_KEY } from './api-timeout.decorator';

@Injectable()
export class ApiRacingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiRacingInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return defer(() => {
      const startedAt = Date.now();
      const timeoutMs = this.reflector.getAllAndOverride<number>(API_TIMEOUT_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      const response$ = timeoutMs
        ? from(this.raceWithTimeout(next.handle(), timeoutMs))
        : next.handle();

      return response$.pipe(finalize(() => this.logElapsedTime(context, startedAt, timeoutMs)));
    });
  }

  private async raceWithTimeout<T>(response$: Observable<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new RequestTimeoutException(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([firstValueFrom(response$), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private logElapsedTime(context: ExecutionContext, startedAt: number, timeoutMs?: number): void {
    const request = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
    const method = request.method ?? 'UNKNOWN';
    const url = request.url ?? 'UNKNOWN';
    const elapsedMs = Date.now() - startedAt;
    const timeoutText = timeoutMs ? ` timeout=${timeoutMs}ms` : '';

    this.logger.log(`${method} ${url} ${elapsedMs}ms${timeoutText}`);
  }
}
