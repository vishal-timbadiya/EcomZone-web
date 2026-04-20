import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);
  
    if ("error" in auth) {
      return res.status(auth.status).json({ message: auth.error });
    }
  
    try {
      const userId = (auth.user as any).id;
  
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
  
      return res.json(orders);
  
    } catch (error: any) {
      console.error("Fetch Orders Error:", error);
  
      return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
  });

export default router;
