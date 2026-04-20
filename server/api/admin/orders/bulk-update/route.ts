import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { Router, Request, Response } from 'express';

const router = Router();

router.patch('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const { orderIds, orderStatus, paymentStatus, courierName, trackingId } = body;
  
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "No orders specified" });
      }
  
      if (!orderStatus && !paymentStatus && !courierName && !trackingId) {
        return res.status(400).json({ message: "Please specify at least one field to update" });
      }
  
      // Build update data object
      const updateData: any = {};
      
      if (orderStatus) {
        // Map string to Prisma enum - use type assertion
        const statusMap: Record<string, any> = {
          "CONFIRMED": OrderStatus.CONFIRMED,
          "PACKED": "PACKED", // Will work after database is updated
          "DISPATCHED": OrderStatus.DISPATCHED,
          "DELIVERED": OrderStatus.DELIVERED,
          "CANCELLED": OrderStatus.CANCELLED,
        };
        updateData.orderStatus = statusMap[orderStatus] || orderStatus;
      }
      
      if (paymentStatus) {
        const paymentMap: Record<string, any> = {
          "PENDING": PaymentStatus.PENDING,
          "SUCCESS": PaymentStatus.SUCCESS,
          "FAILED": PaymentStatus.FAILED,
        };
        updateData.paymentStatus = paymentMap[paymentStatus] || paymentStatus;
      }
      
      if (courierName !== undefined) {
        updateData.courierName = courierName || null;
      }
      
      if (trackingId !== undefined) {
        updateData.trackingId = trackingId || null;
      }
  
      // Update each order using Prisma
      let updatedCount = 0;
      
      for (const orderId of orderIds) {
        try {
          await prisma.order.update({
            where: { orderId },
            data: updateData,
          });
          updatedCount++;
        } catch (err) {
          console.error(`Error updating order ${orderId}:`, err);
        }
      }
  
      return res.json({
        success: true,
        message: `Updated ${updatedCount} order(s)`,
        updatedCount,
      });
    } catch (error: any) {
      console.error("Bulk Update Error:", error);
      return res.status(error.status || 500).json({ message: "Error updating orders: " + error.message, error: error.message });
    }
  });

export default router;
