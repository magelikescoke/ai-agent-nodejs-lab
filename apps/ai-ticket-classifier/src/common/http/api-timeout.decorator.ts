import { SetMetadata } from '@nestjs/common';

export const API_TIMEOUT_METADATA_KEY = Symbol('api-timeout-ms');

export const ApiTimeout = (timeoutMs: number): ClassDecorator & MethodDecorator => {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('ApiTimeout expects a positive integer timeout in milliseconds.');
  }

  return SetMetadata(API_TIMEOUT_METADATA_KEY, timeoutMs);
};
