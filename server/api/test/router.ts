import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    res.json({ message: 'PostgreSQL Connected', result });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

export default router;
