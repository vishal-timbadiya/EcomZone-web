import { Router, Request, Response } from 'express';

const router = Router();

// Stub for youtube shorts - not currently implemented
router.get('/', async (_req: Request, res: Response) => {
  try {
    return res.json({ 
      message: 'YouTube Shorts API - Not implemented',
      shorts: []
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch youtube shorts' 
    });
  }
});

export default router;
