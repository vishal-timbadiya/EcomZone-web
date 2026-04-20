import { Router, Request, Response } from 'express';

const router = Router();

// Stub for shipping rates router - not currently implemented
router.get('/', async (_req: Request, res: Response) => {
  return res.json({ 
    message: 'Shipping Rates Router API - Not implemented',
    rates: []
  });
});

export default router;
