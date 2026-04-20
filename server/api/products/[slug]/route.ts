import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
      const { slug } = req.params;
  
      if (!slug) {
        return res.status(400).json({ message: "Slug or ID is required" });
      }
  
      // Try to find by ID first (UUID format), then by slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
      let product;
      
      if (isUUID) {
        // Search by ID
        product = await prisma.product.findUnique({
          where: { id: slug },
        });
      } else {
        // Search by slug
        product = await prisma.product.findUnique({
          where: { slug },
        });
      }
  
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      return res.json(product);
    } catch (error) {
      console.error("PRODUCT FETCH ERROR:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

export default router;
