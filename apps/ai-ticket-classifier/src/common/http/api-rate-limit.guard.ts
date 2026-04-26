import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';

const API_RATE_LIMIT_MAX_REQUESTS = 60;
const API_RATE_LIMIT_WINDOW_MS = 60 * 1000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  ips?: string[];
  socket?: {
    remoteAddress?: string;
  };
}

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  public constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const now = Date.now();
    const clientIp = this.getClientIp(request);
    const cacheKey = this.getRateLimitCacheKey(clientIp);
    const bucket = await this.getCurrentBucket(cacheKey, now);

    if (bucket.count >= API_RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        `Rate limit exceeded. Try again after ${Math.ceil((bucket.resetAt - now) / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const nextBucket: RateLimitBucket = {
      count: bucket.count + 1,
      resetAt: bucket.resetAt,
    };

    await this.cacheManager.set(cacheKey, nextBucket, Math.max(nextBucket.resetAt - now, 1));

    return true;
  }

  private async getCurrentBucket(cacheKey: string, now: number): Promise<RateLimitBucket> {
    const cached = await this.cacheManager.get<RateLimitBucket>(cacheKey);

    if (!cached || cached.resetAt <= now) {
      return {
        count: 0,
        resetAt: now + API_RATE_LIMIT_WINDOW_MS,
      };
    }

    return cached;
  }

  private getClientIp(request: RequestLike): string {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    return (
      forwardedIp?.split(',')[0]?.trim() ||
      request.ips?.[0] ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private getRateLimitCacheKey(clientIp: string): string {
    return `ApiRateLimit:${clientIp}`;
  }
}
