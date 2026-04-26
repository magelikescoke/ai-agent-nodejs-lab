import { createUuid, hashText, sha256Hex } from './crypto.util';

describe('crypto util', () => {
  it('hashes text as sha256 by default', () => {
    expect(hashText('ticket-content')).toBe(sha256Hex('ticket-content'));
    expect(sha256Hex('ticket-content')).toHaveLength(64);
  });

  it('supports explicit hash algorithms', () => {
    expect(hashText('ticket-content', 'md5')).toHaveLength(32);
    expect(hashText('ticket-content', 'sha1')).toHaveLength(40);
  });

  it('creates UUID values', () => {
    expect(createUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
