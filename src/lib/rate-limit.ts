import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter (works on Vercel serverless with short TTLs)
// For production at scale, replace with Upstash Redis-backed limiter

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (unref to avoid blocking process exit)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (now > entry.resetAt) cache.delete(key);
  });
}, 60_000);
if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  cleanupTimer.unref();
}

interface RateLimitConfig {
  windowMs: number;   // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints — strict
  '/auth': { windowMs: 60_000, maxRequests: 10 },
  // API routes
  '/api/': { windowMs: 60_000, maxRequests: 30 },
  // Story upload
  '/create': { windowMs: 60_000, maxRequests: 5 },
  // General pages — lenient
  default: { windowMs: 60_000, maxRequests: 100 },
};

function getConfig(pathname: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
    if (prefix !== 'default' && pathname.startsWith(prefix)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const pathname = request.nextUrl.pathname;
  const config = getConfig(pathname);
  const key = `${ip}:${pathname.split('/').slice(0, 2).join('/')}`;

  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || now > entry.resetAt) {
    cache.set(key, { count: 1, resetAt: now + config.windowMs });
    return null; // Allowed
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: '請求過於頻繁，請稍後再試' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(entry.resetAt),
        },
      }
    );
  }

  return null; // Allowed
}
