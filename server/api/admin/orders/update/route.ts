import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.put('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const { orderId, orderStatus, paymentStatus, courierName, trackingId } = body;
  
      const existingOrder = await prisma.order.findUnique({
        where: { orderId },
      });
  
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      // Use raw SQL for the update to avoid enum issues
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      if (orderStatus) {
        // Cast text to enum using :: syntax
        updates.push(`"orderStatus" = $${paramIndex++}::"OrderStatus"`);
        params.push(orderStatus);
      }
      
      if (paymentStatus) {
        updates.push(`"paymentStatus" = $${paramIndex++}::"PaymentStatus"`);
        params.push(paymentStatus);
      }
      
      if (courierName !== undefined) {
        updates.push(`"courierName" = $${paramIndex++}`);
        params.push(courierName);
      }
      
      if (trackingId !== undefined) {
        updates.push(`"trackingId" = $${paramIndex++}`);
        params.push(trackingId);
      }
      
      if (updates.length === 0) {
        return res.json({ message: "No updates provided" });
      }
      
      params.push(orderId);
      
      await prisma.$executeRawUnsafe(
        `UPDATE "Order" SET ${updates.join(', ')} WHERE "orderId" = $${paramIndex}`,
        ...params
      );
  
      const updatedOrder = await prisma.order.findUnique({
        where: { orderId },
      });
  
      return res.json({
        message: "Order updated successfully",
        updatedOrder,
      });
    } catch (error: any) {
      console.error("Admin Order Update Error:", error.message);
  
      return res.status(401).json({ message: "Unauthorized or update failed" });
    }
  });

export default router;
