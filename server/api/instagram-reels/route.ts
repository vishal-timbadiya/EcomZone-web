import { Router, Request, Response } from 'express';

const router = Router();

// Stub for instagram reels
router.get('/', async (_req: Request, res: Response) => {
  return res.json({ reels: [] });
});

export default router;
