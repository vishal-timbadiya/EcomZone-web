import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      console.log('[ADMIN-CATEGORIES-GET] Fetching categories...');
      
      const categories = await prisma.category.findMany({
        orderBy: { position: 'asc' }
      });
  
      console.log(`[ADMIN-CATEGORIES-GET] Found ${categories.length} categories:`, categories);
  
      return res.json({ categories });
    } catch (error) {
      console.error('[ADMIN-CATEGORIES-GET] Error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      return res.status(error.status || 500).json({ error: errorMsg, type: 'query_error' });
    }
  });

router.post('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const body = req.body;
      const { name, icon = '📦', imageUrl = '' } = body;
  
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Category name is required (min 2 chars)' });
      }
  
      const slug = name.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-|-$/g, '');
  
      // Check slug uniqueness
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) {
        return res.status(409).json({ error: 'Category slug already exists' });
      }
  
      // Get the next position
      const maxPosition = await prisma.category.findFirst({
        orderBy: { position: 'desc' },
        select: { position: true }
      });
      const nextPosition = (maxPosition?.position ?? -1) + 1;
  
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug,
          icon,
          imageUrl,
          position: nextPosition
        }
      });
  
      console.log(`[ADMIN-CATEGORIES-CREATE] Created category:`, category);
  
      return res.status(201).json({ category });
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(error.status || 500).json({ error: 'Internal Server Error' });
    }
  });

export default router;
