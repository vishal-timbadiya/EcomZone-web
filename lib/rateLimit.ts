import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Rate limiting for Next.js route handlers.
 *
 * The auth endpoints live in the Next.js app router and are explicitly routed
 * away from Express by custom-server.ts, so the express-rate-limit middleware in
 * server/lib/rateLimiter.ts never sees them. This is the equivalent guard for
 * that side of the app.
 *
 * State is in-process, which is correct for the current single-instance
 * deployment. If the app is ever scaled to multiple instances this must move to
 * a shared store (Redis) or each instance will enforce its own separate quota.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Drop expired buckets periodically so the map cannot grow without bound under a
// distributed attack. unref() keeps the timer from holding the process open.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000);

if (typeof sweeper.unref === 'function') sweeper.unref();

const disabled = process.env.RATE_LIMIT_DISABLED === 'true';

/**
 * Resolve the client address. Behind a reverse proxy the socket address is the
 * proxy, so prefer the forwarded headers the platform sets.
 */
function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Left-most entry is the original client.
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export interface RateLimitRule {
  /** Identifier so different endpoints keep separate quotas. */
  name: string;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests permitted per window. */
  max: number;
  /** Message returned when the limit is exceeded. */
  message: string;
}

export const LOGIN_LIMIT: RateLimitRule = {
  name: 'login',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
};

export const SIGNUP_LIMIT: RateLimitRule = {
  name: 'signup',
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many accounts created, please try again later',
};

export const FORGOT_PASSWORD_LIMIT: RateLimitRule = {
  name: 'forgot-password',
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests, please try again later',
};

export const SUB_ADMIN_LIMIT: RateLimitRule = {
  name: 'sub-admin',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later',
};

/**
 * Consume one unit of quota. Returns a 429 response when the caller is over the
 * limit, or null when the request may proceed.
 */
export function enforceRateLimit(
  request: NextRequest,
  rule: RateLimitRule
): NextResponse | null {
  if (disabled) return null;

  const key = `${rule.name}:${clientKey(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > rule.max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: rule.message, message: rule.message },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'RateLimit-Limit': String(rule.max),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(retryAfter),
        },
      }
    );
  }

  return null;
}
