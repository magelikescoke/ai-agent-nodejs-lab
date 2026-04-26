import { hasText, normalizeWhitespace, trimText, truncateText } from './string.util';

describe('string util', () => {
  it('trims text', () => {
    expect(trimText('  content  ')).toBe('content');
  });

  it('normalizes whitespace', () => {
    expect(normalizeWhitespace('  customer   cannot\n\nsign\tin  ')).toBe(
      'customer cannot sign in',
    );
  });

  it('checks whether a value contains text', () => {
    expect(hasText('content')).toBe(true);
    expect(hasText('   ')).toBe(false);
    expect(hasText(undefined)).toBe(false);
  });

  it('truncates text without padding', () => {
    expect(truncateText('abcdef', 3)).toBe('abc');
    expect(truncateText('abc', 3)).toBe('abc');
  });

  it('rejects negative truncate lengths', () => {
    expect(() => truncateText('abc', -1)).toThrow('maxLength');
  });
});
