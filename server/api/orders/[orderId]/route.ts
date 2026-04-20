import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
      const { orderId } = req.params;
  
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
  
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      return res.json(order);
    } catch (error) {
      console.error("Fetch Order Error:", error);
  
      return res.status(500).json({ message: "Error fetching order" });
    }
  });

export default router;
