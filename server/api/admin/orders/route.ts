import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { verifyAdminPermission } from '../../../lib/adminAuth';

const router = Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * List orders for the admin panel.
 *
 * This previously ran a raw SELECT over every order and then issued one further
 * query per order to load its items - a thousand orders meant a thousand and one
 * round trips, all fired concurrently at the connection pool. It is now a single
 * paginated query with the relations included.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdminPermission(req, 'manageOrders');

    const take = Math.min(
      Math.max(parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const skip = Math.max(parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          user: {
            select: { name: true, email: true, mobile: true },
          },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.order.count(),
    ]);

    const payload = orders.map((order) => ({
      id: order.id,
      orderId: order.orderId,
      userId: order.userId,
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      shippingCharge: order.shippingCharge,
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      courierName: order.courierName,
      trackingId: order.trackingId,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      gstDetails: order.gstDetails,
      createdAt: order.createdAt,
      user: order.user,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: { name: item.product?.name ?? '' },
      })),
    }));

    // The admin UI reads this response as a bare array, so the shape is
    // preserved and the pagination totals go in headers.
    res.set({
      'X-Total-Count': String(total),
      'X-Limit': String(take),
      'X-Offset': String(skip),
    });

    return res.json(payload);
  } catch (error: any) {
    console.error('Admin Orders Fetch Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error fetching orders' });
  }
});

export default router;
