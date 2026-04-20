import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });

router.patch('/', async (req: Request, res: Response) => {
  try {
      const { id  } = req.params;
      await verifyAdmin(req);
  
      const body = req.body;
      const { isActive } = body;
  
      const product = await prisma.product.update({
        where: { id },
        data: { isActive },
      });
  
      return res.json({
        message: "Product status updated",
        product,
      });
    } catch (error: any) {
      console.error("Toggle Product Error:", error.message);
      return res.status(error.status || 500).json({ message: "Error updating product status" });
    }
  });

export default router;
