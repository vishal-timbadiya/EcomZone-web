import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    return res.json({ message: 'Seed categories endpoint - not implemented' });
  } catch (error: any) {
    return res.status(error.status || 500).json({ message: 'Error seeding categories' });
  }
});

export default router;
