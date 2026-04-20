import { Router, Request, Response } from 'express';
import { verifyAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || "Failed to fetch order" 
    });
  }
});

export default router;
