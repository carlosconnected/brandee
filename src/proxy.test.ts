import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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

function makeChatRequest() {
  return new NextRequest('http://localhost/api/chat', { method: 'POST' });
}

describe('proxy — no Upstash env vars', () => {
  it('passes through without rate limiting', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).not.toBe(429);
  });

  it('passes through non-chat routes', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const req = new NextRequest('http://localhost/api/other', { method: 'POST' });
    const res = await proxy(req);
    expect(res.status).not.toBe(429);
  });

  it('passes through GET requests to /api/chat', async () => {
    vi.resetModules();
    const { proxy } = await import('@/proxy');
    const req = new NextRequest('http://localhost/api/chat', { method: 'GET' });
    const res = await proxy(req);
    expect(res.status).not.toBe(429);
  });
});

describe('proxy — Upstash configured', () => {
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

  it('includes Retry-After and rate limit headers on 429', async () => {
    const reset = Date.now() + 30_000;
    mockLimit.mockResolvedValue({ success: false, limit: 15, remaining: 0, reset });
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(res.headers.get('X-RateLimit-Limit')).toBe('15');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('passes through when rate limit is not exceeded', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 15, remaining: 14, reset: Date.now() + 60_000 });
    const { proxy } = await import('@/proxy');
    const res = await proxy(makeChatRequest());
    expect(res.status).not.toBe(429);
  });
});
