import { describe, it, expect } from 'vitest';
import { createToken, verifyToken } from './token';

const SECRET = 'test-secret-32-chars-long-enough!';

describe('createToken', () => {
  it('produces a nonce.signature string', async () => {
    const token = await createToken(SECRET);
    expect(token).toMatch(/^[a-f0-9]+\.[a-f0-9]+$/);
  });

  it('produces unique tokens on each call', async () => {
    const [a, b] = await Promise.all([createToken(SECRET), createToken(SECRET)]);
    expect(a).not.toBe(b);
  });
});

describe('verifyToken', () => {
  it('accepts a valid token', async () => {
    const token = await createToken(SECRET);
    expect(await verifyToken(token, SECRET)).toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createToken(SECRET);
    expect(await verifyToken(token, 'wrong-secret')).toBe(false);
  });

  it('rejects a tampered nonce', async () => {
    const token = await createToken(SECRET);
    const sig   = token.slice(token.lastIndexOf('.'));
    expect(await verifyToken(`tampered${sig}`, SECRET)).toBe(false);
  });

  it('rejects a tampered signature', async () => {
    const token = await createToken(SECRET);
    const nonce = token.slice(0, token.lastIndexOf('.'));
    expect(await verifyToken(`${nonce}.deadbeef`, SECRET)).toBe(false);
  });

  it('rejects an empty string', async () => {
    expect(await verifyToken('', SECRET)).toBe(false);
  });

  it('rejects a token with no dot separator', async () => {
    expect(await verifyToken('nodothere', SECRET)).toBe(false);
  });
});
