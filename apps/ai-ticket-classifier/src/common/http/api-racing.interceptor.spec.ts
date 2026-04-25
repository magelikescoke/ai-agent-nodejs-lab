import {
  CallHandler,
  ExecutionContext,
  Logger,
  RequestTimeoutException,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, NEVER, Observable, of } from 'rxjs';
import { API_TIMEOUT_METADATA_KEY } from './api-timeout.decorator';
import { ApiRacingInterceptor } from './api-racing.interceptor';

describe('ApiRacingInterceptor', () => {
  let interceptor: ApiRacingInterceptor;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new ApiRacingInterceptor(new Reflector());
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('passes through responses without timeout metadata', async () => {
    const handler = function testHandler(): void {};
    const result = await firstValueFrom(
      interceptor.intercept(createContext(handler), createCallHandler(of({ ok: true }))),
    );

    expect(result).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test'));
  });

  it('races responses against ApiTimeout metadata', async () => {
    const handler = function testHandler(): void {};
    Reflect.defineMetadata(API_TIMEOUT_METADATA_KEY, 5, handler);

    await expect(
      firstValueFrom(interceptor.intercept(createContext(handler), createCallHandler(NEVER))),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });
});

function createCallHandler(response$: Observable<unknown>): CallHandler<unknown> {
  return {
    handle: () => response$,
  };
}

function createContext(handler: () => void): ExecutionContext {
  class TestController {}

  return {
    getHandler: () => handler,
    getClass: () => TestController as Type<unknown>,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/test',
      }),
    }),
  } as unknown as ExecutionContext;
}
