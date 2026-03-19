import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Backend server is running', timestamp: new Date() });
});

// API Routes - Import and use all routes
// TODO: Import and mount all routes from src/api/

// Example route structure (to be replaced with actual imports):
// import authRoutes from './api/auth/route';
// import productRoutes from './api/products/route';
// import categoryRoutes from './api/categories/route';
// etc.

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/categories', categoryRoutes);
// etc.

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Backend server running on http://localhost:${PORT}`);
      console.log(`✓ CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
