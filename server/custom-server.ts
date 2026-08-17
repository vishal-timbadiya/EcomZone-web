import dotenv from 'dotenv';
dotenv.config();

import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { prisma } from './lib/prisma';
import { assertJwtConfigured } from '../lib/jwt';
import { logger } from './lib/logger';
import expressApp from './server';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const nextApp = next({ dev, port });
const handle = nextApp.getRequestHandler();

let server: Server | undefined;

/**
 * Validate required configuration before accepting any traffic, so a missing or
 * placeholder secret fails the boot instead of every individual request.
 */
function assertEnvironment(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  assertJwtConfigured();

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.warn(
        'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set - online payment will be unavailable'
      );
    }
    if (!process.env.FRONTEND_URL) {
      logger.warn('FRONTEND_URL is not set - CORS will fall back to the default allowlist');
    }
  }
}

async function startServer() {
  try {
    assertEnvironment();

    // Connect to database
    await prisma.$connect();
    logger.info('Database connected');

    // Prepare Next.js
    await nextApp.prepare();

    // Create unified HTTP server
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const parsedUrl = parse(req.url || '/', true);
      const pathname = parsedUrl.pathname || '/';

      // Express handles standard API routes and uploads, EXCEPT Next.js auth routes
      if (
        (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) ||
        pathname.startsWith('/uploads/') ||
        pathname === '/health'
      ) {
        expressApp(req as any, res as any);
      } else {
        // Next.js handles all frontend pages AND internal auth routes (/api/auth)
        handle(req, res, parsedUrl);
      }
    });

    server.listen(port, () => {
      logger.info(`EcomZone running on port ${port}`);
    });
  } catch (error) {
    logger.error(
      { message: error instanceof Error ? error.message : String(error) },
      'Failed to start server'
    );
    process.exit(1);
  }
}

/**
 * Stop accepting connections, then close the database pool. The previous handler
 * only listened for SIGINT, so container stops (SIGTERM) killed the process
 * without draining in-flight requests.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 15000);

  forceExit.unref();

  try {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await prisma.$disconnect();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

startServer();
