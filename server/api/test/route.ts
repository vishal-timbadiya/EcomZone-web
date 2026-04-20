import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    return res.json({ message: "PostgreSQL Connected", result });
  } catch (error: any) {
    return res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

export default router;
