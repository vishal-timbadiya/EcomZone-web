import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      const body = req.body;
      const { orderId, mobile } = body;
  
      if (!orderId || !mobile) {
        return res.status(400).json({ message: "Order ID and mobile are required" });
      }
  
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: {
          user: true,
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
  
      if (order.user.mobile !== mobile) {
        return res.status(403).json({ message: "Invalid mobile number" });
      }
  
      return res.json({
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentMode: order.paymentMode,
        paymentStatus: order.paymentStatus,
        courierName: order.courierName,
        trackingId: order.trackingId,
        totalAmount: order.totalAmount,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });
  
    } catch (error: any) {
      return res.status(500).json({ message: "Tracking failed", error: error.message });
    }
  });

export default router;
