import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware';
import { Router, Request, Response } from 'express';

const router = Router();

router.patch('/', async (req: Request, res: Response) => {
  const auth = requireAdmin(req);
  
  if ("error" in auth) {
    return res.status(auth.status).json({ message: auth.error });
  }
  
    try {
      const { orderId, paymentStatus } = req.body;
  
      if (!orderId || !paymentStatus) {
        return res.status(400).json({ message: "orderId and paymentStatus required" });
      }
  
      const updated = await prisma.order.update({
        where: { orderId },
        data: { paymentStatus },
      });
  
      return res.json({
        message: "Payment status updated",
        updated,
      });
  
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: "Payment update failed", error: error.message });
    }
  });

export default router;
