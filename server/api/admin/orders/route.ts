import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      // Use raw SQL to avoid Prisma client caching issues
      const orders = await prisma.$queryRawUnsafe<any[]>(`
        SELECT o.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
        FROM "Order" o
        JOIN "User" u ON o."userId" = u.id
        ORDER BY o."createdAt" DESC
      `);
  
      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order: any) => {
          const itemsResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT oi.*, p.name as product_name
             FROM "OrderItem" oi
             JOIN "Product" p ON oi."productId" = p.id
             WHERE oi."orderId" = $1`,
            order.id
          );
  
          return {
            id: order.id,
            orderId: order.orderId,
            userId: order.userId,
            subtotal: parseFloat(order.subtotal.toString()),
            gstAmount: parseFloat(order.gstAmount.toString()),
            totalAmount: parseFloat(order.totalAmount.toString()),
            paymentMode: order.paymentMode,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            courierName: order.courierName,
            trackingId: order.trackingId,
            createdAt: order.createdAt,
            user: {
              name: order.user_name,
              email: order.user_email,
              mobile: order.user_mobile,
            },
            items: itemsResult.map((item: any) => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: parseFloat(item.price.toString()),
              product: {
                name: item.product_name,
              },
            })),
          };
        })
      );
  
      return res.json(ordersWithItems);
    } catch (error: any) {
      console.error("Admin Orders Fetch Error: ", error.message);
      return res.status(error.status || 500).json({ message: "Error fetching orders", error: error.message });
    }
  });

export default router;
