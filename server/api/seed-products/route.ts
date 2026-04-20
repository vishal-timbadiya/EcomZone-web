import { Router, Request, Response } from 'express';

const router = Router();

// Stub for seed-products
router.post('/', async (_req: Request, res: Response) => {
  return res.json({ message: 'Seed endpoint not implemented' });
});

export default router;
