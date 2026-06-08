import dotenv from 'dotenv';
dotenv.config();

import { createServer, IncomingMessage, ServerResponse } from 'http';
import next from 'next';
import { prisma } from './lib/prisma';
import expressApp from './server';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const nextApp = next({ dev, port });
const handle = nextApp.getRequestHandler();

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✓ Database connected');

    // Prepare Next.js
    await nextApp.prepare();

    // Create unified HTTP server
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url!, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      // Express handles standard API routes and uploads, EXCEPT Next.js auth routes
      if (
        (pathname?.startsWith('/api/') && !pathname?.startsWith('/api/auth/')) ||
        pathname?.startsWith('/uploads/') ||
        pathname === '/health'
      ) {
        expressApp(req as any, res as any);
      } else {
        // Next.js handles all frontend pages AND internal auth routes (/api/auth)
        handle(req, res, { pathname, query: Object.fromEntries(url.searchParams) });
      }
    });

    server.listen(port, () => {
      console.log(`✓ EcomZone running on http://localhost:${port}`);
      console.log(`  Frontend: http://localhost:${port}`);
      console.log(`  API:      http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
