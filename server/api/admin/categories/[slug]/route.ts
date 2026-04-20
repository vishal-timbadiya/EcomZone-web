import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '50');
      const { slug  } = req.params;
  
      // Get category
      const category = await prisma.category.findUnique({
        where: { slug }
      });
  
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      // Get all products in category (active/inactive)
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { category: slug },
            { categories: { has: slug } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });
  
      const total = await prisma.product.count({
        where: {
          OR: [
            { category: slug },
            { categories: { has: slug } }
          ]
        }
      });
  
      return res.json({
        category,
        products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      console.error('Error fetching admin category products:', error);
      return res.status(error.status || 500).json({ error: 'Internal Server Error' });
    }
  });

export default router;
