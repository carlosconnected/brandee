import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createToken, verifyToken, COOKIE_NAME } from '@/lib/token';

// ── Rate limiter ─────────────────────────────────────────────────────────────
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(15, '60 s'),
        analytics: true,
        prefix: 'brandee:rl',
      })
    : null;

const COOKIE_SECRET = process.env.COOKIE_SECRET;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API route: validate session cookie then rate-limit ───────────────────
  if (pathname === '/api/chat' && request.method === 'POST') {
    if (COOKIE_SECRET) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token || !(await verifyToken(token, COOKIE_SECRET))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!ratelimit) return NextResponse.next();

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

  // ── Page visits: issue or refresh session cookie if missing or invalid ───
  if (COOKIE_SECRET) {
    const existing = request.cookies.get(COOKIE_NAME)?.value;
    const valid    = existing ? await verifyToken(existing, COOKIE_SECRET) : false;
    if (!valid) {
      const token    = await createToken(COOKIE_SECRET);
      const response = NextResponse.next();
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
