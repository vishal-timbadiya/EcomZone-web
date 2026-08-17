import rateLimit, { Options } from 'express-rate-limit';
import type { Request } from 'express';

// ============================================
// Shared configuration
//
// The app sits behind a reverse proxy in production (see `trust proxy` in
// server.ts), so req.ip is the real client address. ipKeyGenerator normalises
// IPv6 addresses to a /56 subnet so a single client cannot rotate through its
// address range to bypass the limit.
//
// Limits apply in every environment. Previously each limiter skipped unless
// NODE_ENV === 'production', which left staging and preview deployments
// completely unprotected. Set RATE_LIMIT_DISABLED=true to opt out locally.
// ============================================

const disabled = process.env.RATE_LIMIT_DISABLED === 'true';

/**
 * Build the limiter key from the client address.
 *
 * A single IPv6 client is typically handed a whole /64 (often a /56) and can
 * freely pick any address inside it, so keying on the full address lets one
 * host bypass the limit entirely. Collapsing to the first four hextets buckets
 * the whole allocation together. IPv4 addresses are used as-is.
 */
function clientKey(req: Request): string {
  const address = req.ip || req.socket.remoteAddress || 'unknown';

  if (!address.includes(':')) return address;

  // Strip any zone index or bracketed port form before truncating.
  const bare = address.replace(/^\[|\]$/g, '').split('%')[0];

  return `${bare.split(':').slice(0, 4).join(':')}::/64`;
}

function baseOptions(windowMs: number, max: number, message: string): Partial<Options> {
  return {
    windowMs,
    max,
    message: { error: message, message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientKey,
    skip: () => disabled,
  };
}

// ============================================
// Login Endpoint Rate Limiter
// Protects against brute force attacks
// ============================================
export const loginLimiter = rateLimit(
  baseOptions(15 * 60 * 1000, 5, 'Too many login attempts, please try again later')
);

// ============================================
// Signup Endpoint Rate Limiter
// Prevents account creation spam
// ============================================
export const signupLimiter = rateLimit(
  baseOptions(60 * 60 * 1000, 10, 'Too many accounts created, please try again later')
);

// ============================================
// Forgot Password Endpoint Rate Limiter
// Prevents password reset spam
// ============================================
export const forgotPasswordLimiter = rateLimit(
  baseOptions(60 * 60 * 1000, 5, 'Too many password reset requests, please try again later')
);

// ============================================
// General API Rate Limiter
// Global limit for all /api/* endpoints
// ============================================
export const apiLimiter = rateLimit({
  ...baseOptions(60 * 1000, 100, 'Too many requests, please try again later'),
  skip: (req: Request) => disabled || req.path === '/health',
});

// ============================================
// Admin Endpoints Rate Limiter
// Stricter limit for admin operations
// ============================================
export const adminLimiter = rateLimit(
  baseOptions(60 * 1000, 50, 'Admin endpoint rate limit exceeded')
);

// ============================================
// File Upload Rate Limiter
// Prevents upload spam
// ============================================
export const uploadLimiter = rateLimit(
  baseOptions(60 * 60 * 1000, 50, 'Upload limit exceeded, please try again later')
);

// ============================================
// Payment Endpoint Rate Limiter
// Prevents payment spam
// ============================================
export const paymentLimiter = rateLimit(
  baseOptions(60 * 1000, 10, 'Too many payment requests, please try again later')
);

// ============================================
// Razorpay Webhook Rate Limiter
// Deliberately generous - Razorpay retries failed deliveries, and dropping a
// legitimate webhook loses a payment confirmation.
// ============================================
export const webhookLimiter = rateLimit(
  baseOptions(60 * 1000, 120, 'Webhook rate limit exceeded')
);
