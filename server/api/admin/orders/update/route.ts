import { prisma } from "../../../../lib/prisma";
import { verifyAdmin } from '../../../../lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.put('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const { orderId, orderStatus, paymentStatus, courierName, trackingId } = body;

      const ORDER_STATUSES = ['CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
      const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED'];

      if (orderStatus && !ORDER_STATUSES.includes(orderStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }

      if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
  
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
      console.error("Admin Order Update Error:", error?.message);

      // Propagate the real status. Every failure - including database errors -
      // used to be reported as 401, which sent anyone debugging it down the
      // wrong path.
      return res
        .status(error?.status || 500)
        .json({ message: error?.status ? error.message : "Order update failed" });
    }
  });

export default router;



