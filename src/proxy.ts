import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Uses Upstash Redis when env vars are present (staging / production on Vercel).
// Falls back gracefully to no-op in local dev so you don't need Redis running
// locally. Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to .env.local
// or let Vercel inject them via the Upstash marketplace integration.
// ─────────────────────────────────────────────────────────────────────────────

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(15, '60 s'), // 15 requests per IP per minute
        analytics: true, // visible in the Upstash console
        prefix: 'brandee:rl',
      })
    : null;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/api/chat' || request.method !== 'POST') {
    return NextResponse.next();
  }

  // Skip rate limiting when Upstash is not configured (local dev)
  if (!ratelimit) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before sending another message.' },
      {
        status: 429,
        headers: {
          'Retry-After':           String(retryAfter),
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/chat',
};
