import { createHash, randomUUID } from 'node:crypto';

export type HashAlgorithm = 'sha256' | 'sha1' | 'md5';

export function hashText(value: string, algorithm: HashAlgorithm = 'sha256'): string {
  return createHash(algorithm).update(value, 'utf8').digest('hex');
}

export function sha256Hex(value: string): string {
  return hashText(value, 'sha256');
}

export function createUuid(): string {
  return randomUUID();
}
