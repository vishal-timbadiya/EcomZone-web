import { Router, Request, Response } from 'express';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware';
import { verifyCheckoutSignature } from '../../../../lib/razorpay';
import { logger } from '../../../../lib/logger';

const router = Router();

/**
 * Confirm a payment from the browser callback.
 *
 * This is the fast path that lets the user see a success page immediately. It is
 * not the source of truth - the webhook is - but because the signature is
 * verified with the API secret the browser cannot forge it.
 */
router.post('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error, message: auth.error });
  }

  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body as Record<string, string | undefined>;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing payment confirmation fields' });
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        userId: true,
        paymentStatus: true,
        razorpayOrderId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== auth.user.userId) {
      return res.status(403).json({ error: 'Not authorized for this order' });
    }

    // The gateway order id must match the one we created for this order,
    // otherwise a valid signature from a different (cheaper) order could be
    // replayed against this one.
    if (order.razorpayOrderId !== razorpayOrderId) {
      logger.warn({
        event: 'razorpay_order_mismatch',
        orderId: order.orderId,
        expected: order.razorpayOrderId,
        received: razorpayOrderId,
      });
      return res.status(400).json({ error: 'Payment does not belong to this order' });
    }

    if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature: razorpaySignature })) {
      logger.warn({ event: 'razorpay_signature_invalid', orderId: order.orderId });
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Idempotent: the webhook may have already marked this order paid.
    if (order.paymentStatus !== 'SUCCESS') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'SUCCESS',
          razorpayPaymentId,
        },
      });
    }

    logger.info({
      event: 'razorpay_payment_verified',
      orderId: order.orderId,
      razorpayPaymentId,
    });

    return res.json({ success: true, orderId: order.orderId, paymentStatus: 'SUCCESS' });
  } catch (error: any) {
    logger.error({ event: 'razorpay_verify_failed', message: error?.message });
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
