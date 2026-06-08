import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';
import { 
  apiLimiter, 
  loginLimiter, 
  signupLimiter, 
  forgotPasswordLimiter,
  adminLimiter,
  uploadLimiter,
  paymentLimiter
} from './lib/rateLimiter';
import * as Sentry from '@sentry/node';

// import all API routes
import authRoutes from './api/auth';
import productsRoutes from './api/products';
import categoriesRoutes from './api/categories';
import ordersRoutes from './api/orders';
import cartRoutes from './api/cart';
import shippingRatesRoutes from './api/shipping-rates';
import paymentRoutes from './api/payment';
import uploadRoutes from './api/upload';
// import emailRoutes from './api/email';
// import cataloguePdfRoutes from './api/catalogue-pdf';
// import invoiceRoutes from './api/invoice';
import adminRoutes from './api/admin';
// import instagramReelsRoutes from './api/instagram-reels';
// import youtubeShortRoutes from './api/youtube-shorts';
// import seedProductsRoutes from './api/seed-products';
import testRoutes from './api/test';

const app: Express = express();

// Initialize Sentry for error tracking (if DSN is provided)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
  });
  app.use(Sentry.Handlers.requestHandler());
  logger.info('Sentry error tracking initialized');
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Serve static files (uploads directory)
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
app.use('/uploads', express.static(uploadsDir));

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
      email: '/api/email',
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

// Global API Rate Limiter (before routes)
app.use('/api/', apiLimiter);

// API Routes - Mount all routes with specific rate limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/signup', signupLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping-rates', shippingRatesRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
// app.use('/api/email', emailRoutes);
// app.use('/api/catalogue-pdf', cataloguePdfRoutes);
// app.use('/api/invoice', invoiceRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
// app.use('/api/instagram-reels', instagramReelsRoutes);
// app.use('/api/youtube-shorts', youtubeShortRoutes);
// app.use('/api/seed-products', seedProductsRoutes);
app.use('/api/test', testRoutes);

// Error handling middleware - MUST be before Sentry handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    event: 'unhandled_error',
    message: err.message,
    path: req.path,
    method: req.method,
    status: err.status || err.statusCode || 500,
  });

  // Always respond with JSON
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    message: message,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      path: req.path,
      method: req.method
    } : undefined
  });
  
  // Call Sentry if available
  if (process.env.SENTRY_DSN) {
    next(err);
  }
});

// Sentry error handler (if initialized)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
