import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = Router({ mergeParams: true });

router.post('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const body = req.body;
      const { id, direction } = body;
  
      if (!id || !direction) {
        return res.status(400).json({ error: 'id and direction required' });
      }
  
      // Get current category
      const current = await prisma.category.findUnique({ where: { id } });
      if (!current) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      if (direction === 'up') {
        // Find category with position less than current, order by position desc (closest one)
        const prev = await prisma.category.findFirst({
          where: { position: { lt: current.position } },
          orderBy: { position: 'desc' }
        });
  
        if (!prev) {
          return res.status(400).json({ error: 'Already at top' });
        }
  
        // Swap positions
        await prisma.category.update({ where: { id: current.id }, data: { position: prev.position } });
        await prisma.category.update({ where: { id: prev.id }, data: { position: current.position } });
      } else if (direction === 'down') {
        // Find category with position greater than current, order by position asc (closest one)
        const next = await prisma.category.findFirst({
          where: { position: { gt: current.position } },
          orderBy: { position: 'asc' }
        });
  
        if (!next) {
          return res.status(400).json({ error: 'Already at bottom' });
        }
  
        // Swap positions
        await prisma.category.update({ where: { id: current.id }, data: { position: next.position } });
        await prisma.category.update({ where: { id: next.id }, data: { position: current.position } });
      } else {
        return res.status(400).json({ error: 'Invalid direction' });
      }
  
      // Return updated categories in new order
      const categories = await prisma.category.findMany({
        orderBy: { position: 'asc' }
      });
  
      return res.json({ categories });
    } catch (error) {
      console.error('Error reordering categories:', error);
      return res.status(error.status || 500).json({ error: 'Internal Server Error' });
    }
  });

router.put('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const { id  } = req.params;
      const body = req.body;
      const { name, icon, imageUrl } = body;
  
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Category name is required (min 2 chars)' });
      }
  
      const slug = name.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-|-$/g, '');
  
      // Check if another category has this slug
      const existing = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });
  
      if (existing) {
        return res.status(409).json({ error: 'Category slug already exists' });
      }
  
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        icon,
        imageUrl
      }
    });

    // Fetch all categories for response
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' }
    });

    return res.json({ categories, message: 'Category updated successfully' });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(error.status || 500).json({ error: 'Internal Server Error' });
    }
  });

router.delete('/', async (req: Request, res: Response) => {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Fetch category slug once to avoid multiple queries
    const category = await prisma.category.findUnique({
      where: { id },
      select: { slug: true }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: {
        OR: [
          { category: { equals: category.slug } },
          { categories: { has: category.slug } }
        ]
      }
    });

    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category with ${productCount} products. Remove products first.`
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(error.status || 500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/', async (req: Request, res: Response) => {
  try {
      const user = await verifyAdmin(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const { id  } = req.params;
      const body = req.body;
      const { isActive } = body;
  
      const category = await prisma.category.update({
        where: { id },
        data: { isActive }
      });
  
      return res.json({ category });
    } catch (error) {
      console.error('Error toggling category:', error);
      return res.status(error.status || 500).json({ error: 'Internal Server Error' });
    }
  });

export default router;
