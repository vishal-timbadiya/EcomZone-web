import { Router, Request, Response } from 'express';

const router = Router();

// Stub for youtube shorts router - not currently implemented
router.get('/', async (_req: Request, res: Response) => {
  return res.json({ 
    message: 'YouTube Shorts API - Not implemented',
    shorts: []
  });
});

export default router;
