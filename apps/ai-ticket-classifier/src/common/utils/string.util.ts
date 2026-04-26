export function trimText(value: string): string {
  return value.trim();
}

export function normalizeWhitespace(value: string): string {
  return trimText(value).replace(/\s+/g, ' ');
}

export function hasText(value: unknown): value is string {
  return typeof value === 'string' && trimText(value).length > 0;
}

export function truncateText(value: string, maxLength: number): string {
  if (maxLength < 0) {
    throw new RangeError('maxLength must be greater than or equal to 0');
  }

  return value.length <= maxLength ? value : value.slice(0, maxLength);
}
