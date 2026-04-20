import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'Backend server is running', timestamp: new Date() });
});

// API Routes - Mount all routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/shipping-rates', shippingRatesRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/email', emailRoutes);
// app.use('/api/catalogue-pdf', cataloguePdfRoutes);
// app.use('/api/invoice', invoiceRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/instagram-reels', instagramReelsRoutes);
// app.use('/api/youtube-shorts', youtubeShortRoutes);
// app.use('/api/seed-products', seedProductsRoutes);
app.use('/api/test', testRoutes);

// Error handling middleware - MUST be last
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Express Error Handler triggered:');
  console.error('  Error:', err);
  console.error('  Message:', err.message);
  console.error('  Status:', err.status);
  console.error('  Path:', req.path);
  console.error('  Method:', req.method);

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
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
