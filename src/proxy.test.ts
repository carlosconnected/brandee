import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Upstash mocks ─────────────────────────────────────────────────────────────
const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = vi.fn().mockReturnValue({});
    limit = mockLimit;
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}));

// ── Token mocks ───────────────────────────────────────────────────────────────
const mockVerifyToken = vi.fn();
const mockCreateToken = vi.fn();

vi.mock('@/lib/token', () => ({
  COOKIE_NAME:  '__brandee_session',
  verifyToken:  mockVerifyToken,
  createToken:  mockCreateToken,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeChatRequest(cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) headers.set('cookie', `__brandee_session=${cookieValue}`);
  return new NextRequest('http://localhost/api/chat', { method: 'POST', headers });
}

function makePageRequest(cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) headers.set('cookie', `__brandee_session=${cookieValue}`);
  return new NextRequest('http://localhost/', { method: 'GET', headers });
}

// ── Tests: no Upstash, no COOKIE_SECRET ──────────────────────────────────────
describe('proxy — no env vars configured', () => {
  it('passes through API requests without cookie check', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(429);
  });

  it('passes through page visits', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const res = await proxy(makePageRequest());
    expect(res.status).not.toBe(401);
  });

  it('passes through non-POST /api/chat requests', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const req = new NextRequest('http://localhost/api/chat', { method: 'GET' });
    const res = await proxy(req);
    expect(res.status).not.toBe(401);
  });
});

// ── Tests: COOKIE_SECRET configured ──────────────────────────────────────────
describe('proxy — COOKIE_SECRET configured', () => {
  beforeEach(() => {
    process.env.COOKIE_SECRET = 'test-secret';
    vi.resetModules();
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true, limit: 15, remaining: 14, reset: Date.now() + 60_000 });
  });

  afterEach(() => {
    delete process.env.COOKIE_SECRET;
  });

  it('returns 401 when cookie is missing', async () => {
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when cookie is invalid', async () => {
    mockVerifyToken.mockResolvedValue(false);
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest('bad-token'));
    expect(res.status).toBe(401);
  });

  it('passes through when cookie is valid', async () => {
    mockVerifyToken.mockResolvedValue(true);
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest('valid-token'));
    expect(res.status).not.toBe(401);
  });

  it('sets a session cookie when no cookie is present', async () => {
    mockCreateToken.mockResolvedValue('nonce.sig');
    const { proxy } = await import('@/proxy');
    const res = await proxy(makePageRequest());
    expect(res.headers.get('set-cookie')).toContain('__brandee_session');
  });

  it('replaces a stale or invalid cookie on page visit', async () => {
    mockVerifyToken.mockResolvedValue(false);
    mockCreateToken.mockResolvedValue('nonce.sig');
    const { proxy } = await import('@/proxy');
    const res = await proxy(makePageRequest('stale-token'));
    expect(res.headers.get('set-cookie')).toContain('__brandee_session');
  });

  it('does not overwrite a valid existing session cookie on page visit', async () => {
    mockVerifyToken.mockResolvedValue(true);
    const { proxy } = await import('@/proxy');
    await proxy(makePageRequest('valid-token'));
    expect(mockCreateToken).not.toHaveBeenCalled();
  });
});

// ── Tests: rate limiting (COOKIE_SECRET absent so cookie check is skipped) ───
describe('proxy — rate limiting', () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL   = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 15, remaining: 0, reset: Date.now() + 30_000 });
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).toBe(429);
  });

  it('includes rate limit headers on 429', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 15, remaining: 0, reset: Date.now() + 30_000 });
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.headers.get('X-RateLimit-Limit')).toBe('15');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  it('passes through when rate limit is not exceeded', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 15, remaining: 14, reset: Date.now() + 60_000 });
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).not.toBe(429);
  });
});
