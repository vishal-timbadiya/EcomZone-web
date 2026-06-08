import rateLimit from 'express-rate-limit';

// ============================================
// Login Endpoint Rate Limiter
// Protects against brute force attacks
// ============================================
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts max
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV !== 'production';
  },
});

// ============================================
// Signup Endpoint Rate Limiter
// Prevents account creation spam
// ============================================
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 signups per hour per IP
  message: 'Too many accounts created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
});

// ============================================
// Forgot Password Endpoint Rate Limiter
// Prevents password reset spam
// ============================================
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password reset attempts per hour
  message: 'Too many password reset requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
});

// ============================================
// General API Rate Limiter
// Global limit for all /api/* endpoints
// ============================================
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    // Skip for health checks and development
    if (req.path === '/health' || process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  },
});

// ============================================
// Admin Endpoints Rate Limiter
// Stricter limit for admin operations
// ============================================
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Admin endpoint rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
});

// ============================================
// File Upload Rate Limiter
// Prevents upload spam
// ============================================
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Upload limit exceeded, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
});

// ============================================
// Payment Endpoint Rate Limiter
// Prevents payment spam
// ============================================
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment attempts per minute
  message: 'Too many payment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  },
});
