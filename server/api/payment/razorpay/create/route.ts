import { Router, Request, Response } from 'express';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware';
import { getRazorpayClient, getRazorpayConfig, toPaise } from '../../../../lib/razorpay';
import { logger } from '../../../../lib/logger';

const router = Router();

/**
 * Create a Razorpay order for an existing EcomZone order.
 *
 * The amount is read from the database, never from the request body, so a
 * client cannot ask to be charged less than the order is worth.
 */
router.post('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error, message: auth.error });
  }

  try {
    const { orderId } = req.body as { orderId?: string };

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        userId: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMode: true,
        razorpayOrderId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ownership check - an order may only be paid for by the user who placed it.
    if (order.userId !== auth.user.userId) {
      return res.status(403).json({ error: 'Not authorized for this order' });
    }

    if (order.paymentStatus === 'SUCCESS') {
      return res.status(409).json({ error: 'Order is already paid' });
    }

    const { keyId } = getRazorpayConfig();
    const client = getRazorpayClient();

    // Reuse the existing gateway order if one was already created, so a user who
    // abandons and retries the payment sheet does not accumulate orphan orders.
    if (order.razorpayOrderId) {
      try {
        const existing = await client.orders.fetch(order.razorpayOrderId);

        if (existing && existing.status === 'created') {
          return res.json({
            keyId,
            razorpayOrderId: existing.id,
            amount: existing.amount,
            currency: existing.currency,
            orderId: order.orderId,
          });
        }
      } catch (fetchError) {
        logger.warn({
          event: 'razorpay_order_refetch_failed',
          orderId: order.orderId,
          message: fetchError instanceof Error ? fetchError.message : 'unknown',
        });
      }
    }

    const razorpayOrder = await client.orders.create({
      amount: toPaise(order.totalAmount),
      currency: 'INR',
      receipt: order.orderId,
      notes: {
        ecomzoneOrderId: order.orderId,
        userId: order.userId,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    logger.info({
      event: 'razorpay_order_created',
      orderId: order.orderId,
      razorpayOrderId: razorpayOrder.id,
    });

    return res.json({
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order.orderId,
    });
  } catch (error: any) {
    logger.error({
      event: 'razorpay_create_failed',
      message: error?.message,
    });

    return res
      .status(error?.status || 500)
      .json({ error: error?.status === 503 ? 'Online payment is unavailable' : 'Payment initiation failed' });
  }
});

export default router;
