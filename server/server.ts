import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';
import {
  apiLimiter,
  adminLimiter,
  uploadLimiter,
  paymentLimiter
} from './lib/rateLimiter';
import * as Sentry from '@sentry/node';

// import all API routes
import productsRoutes from './api/products';
import categoriesRoutes from './api/categories';
import ordersRoutes from './api/orders';
import cartRoutes from './api/cart';
import shippingRatesRoutes from './api/shipping-rates';
import paymentRoutes from './api/payment';
import uploadRoutes from './api/upload';
import razorpayWebhookRoutes from './api/payment/razorpay/webhook/route';
import cataloguePdfRoutes from './api/catalogue-pdf';
import adminRoutes from './api/admin';
import youtubeShortRoutes from './api/youtube-shorts';

const app: Express = express();

// Initialize Sentry for error tracking (if DSN is provided).
// @sentry/node v8+ removed Sentry.Handlers / Sentry.Integrations; HTTP instrumentation
// is registered automatically by init() and errors are wired up via
// setupExpressErrorHandler() after the routes are mounted.
const sentryEnabled = Boolean(process.env.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  logger.info('Sentry error tracking initialized');
}

// Trust the platform reverse proxy (Render / Hostinger nginx) so that req.ip is the
// real client address rather than the proxy's. Without this every request shares a
// single rate-limit bucket.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://ecomzone.in',
      'https://www.ecomzone.in',
      'http://localhost:3000',         // local development
    ].filter(Boolean);

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Decline without CORS headers instead of throwing, which would surface as a
      // 500 with the origin reflected back in the response body.
      logger.warn({ event: 'cors_blocked', origin });
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// JSON and URL-encoded parsers with exclusions for file uploads
// Skip JSON parsing for multipart form data (file uploads)
app.use(express.json({ 
  limit: '50mb',
  verify: (req: any, res, buf, encoding?: string) => {
    // Store raw body for potential use
    req.rawBody = buf.toString((encoding as any) || 'utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handler for JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Only handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      message: 'Invalid JSON in request body'
    });
  }
  // Pass other errors to next handler
  return next(err);
});

// Serve static files (uploads directory).
// Uploads are restricted to images at the upload endpoint, but these headers make
// sure anything already on disk cannot execute in a browser: no content sniffing,
// no directory listing, and a restrictive CSP for the /uploads origin path.
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
app.use(
  '/uploads',
  express.static(uploadsDir, {
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'EcomZone Backend API', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      cart: '/api/cart',
      shipping: '/api/shipping-rates',
      payment: '/api/payment',
      upload: '/api/upload',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// The Razorpay webhook is mounted before the global limiter. It is authenticated
// by HMAC signature rather than by rate, and Razorpay retries deliveries - a
// dropped webhook is a lost payment confirmation.
app.use('/api/payment/razorpay/webhook', razorpayWebhookRoutes);

// Global API Rate Limiter (before routes)
app.use('/api/', apiLimiter);

// NOTE: /api/auth/* is served by the Next.js app router, not Express (see
// custom-server.ts), so mounting loginLimiter/signupLimiter/forgotPasswordLimiter
// here would be dead code. Those endpoints rate limit themselves via lib/rateLimit.ts.
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping-rates', shippingRatesRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
// These two are called by the storefront (app/catalogues and VideoReelsSection)
// but were left commented out, so both pages failed at runtime.
app.use('/api/catalogue-pdf', cataloguePdfRoutes);
app.use('/api/youtube-shorts', youtubeShortRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// 404 handler - must come after all routes but before the error handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Sentry error handler (if initialized) - must be registered before our own handler
// so it observes the error, and it calls next(err) itself rather than responding.
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

// Final error handler. Responds once and never calls next() - continuing the chain
// after a response has been sent writes after headers.
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;

  logger.error({
    event: 'unhandled_error',
    message: err.message,
    path: req.path,
    method: req.method,
    status: statusCode,
  });

  if (res.headersSent) {
    return;
  }

  // Only leak internal messages for client errors; 5xx returns a generic message so
  // stack traces and driver errors never reach the client.
  const isClientError = statusCode >= 400 && statusCode < 500;
  const message = isClientError ? err.message || 'Bad Request' : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    message,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : undefined
  });
});

export default app;
