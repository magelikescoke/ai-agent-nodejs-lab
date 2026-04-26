import { HttpException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ApiRateLimitGuard } from './api-rate-limit.guard';

function createCacheManagerMock() {
  return {
    get: jest.fn(async (_key: string): Promise<unknown> => undefined),
    set: jest.fn(async (_key: string, _value: unknown, _ttl?: number): Promise<void> => undefined),
  };
}

function createHttpContext(ip = '127.0.0.1'): ExecutionContext {
  return {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        ip,
        headers: {},
      })),
    })),
  } as unknown as ExecutionContext;
}

describe('ApiRateLimitGuard', () => {
  it('allows requests under the IP rate limit and increments the bucket', async () => {
    const cacheManager = createCacheManagerMock();
    cacheManager.get.mockResolvedValueOnce({
      count: 1,
      resetAt: Date.now() + 30_000,
    });
    const guard = new ApiRateLimitGuard(cacheManager as unknown as Cache);

    await expect(guard.canActivate(createHttpContext())).resolves.toBe(true);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'ApiRateLimit:127.0.0.1',
      expect.objectContaining({ count: 2 }),
      expect.any(Number),
    );
  });

  it('starts a new bucket when the IP has no cached rate limit state', async () => {
    const cacheManager = createCacheManagerMock();
    const guard = new ApiRateLimitGuard(cacheManager as unknown as Cache);

    await expect(guard.canActivate(createHttpContext())).resolves.toBe(true);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'ApiRateLimit:127.0.0.1',
      expect.objectContaining({ count: 1 }),
      expect.any(Number),
    );
  });

  it('rejects requests over the IP rate limit', async () => {
    const cacheManager = createCacheManagerMock();
    cacheManager.get.mockResolvedValueOnce({
      count: 60,
      resetAt: Date.now() + 30_000,
    });
    const guard = new ApiRateLimitGuard(cacheManager as unknown as Cache);

    try {
      await guard.canActivate(createHttpContext());
      throw new Error('Expected rate limit guard to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
    expect(cacheManager.set).not.toHaveBeenCalled();
  });

  it('uses x-forwarded-for as the client IP when present', async () => {
    const cacheManager = createCacheManagerMock();
    const guard = new ApiRateLimitGuard(cacheManager as unknown as Cache);
    const context = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({
          ip: '127.0.0.1',
          headers: {
            'x-forwarded-for': '203.0.113.10, 127.0.0.1',
          },
        })),
      })),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(cacheManager.set).toHaveBeenCalledWith(
      'ApiRateLimit:203.0.113.10',
      expect.objectContaining({ count: 1 }),
      expect.any(Number),
    );
  });
});
