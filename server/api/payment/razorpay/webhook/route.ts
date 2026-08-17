import { Router, Request, Response } from 'express';
import { prisma } from '../../../../lib/prisma';
import { verifyWebhookSignature } from '../../../../lib/razorpay';
import { logger } from '../../../../lib/logger';

const router = Router();

interface RawBodyRequest extends Request {
  rawBody?: string;
}

/**
 * Razorpay webhook - the authoritative source of payment state.
 *
 * The signature is verified against the raw request bytes before anything is
 * written. An unverified body is discarded, so this endpoint cannot be used to
 * mark orders paid.
 */
router.post('/', async (req: RawBodyRequest, res: Response) => {
  const signature = req.get('x-razorpay-signature');
  const rawBody = req.rawBody;

  if (!rawBody) {
    logger.error({ event: 'razorpay_webhook_no_raw_body' });
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ event: 'razorpay_webhook_signature_invalid' });
    // 400 rather than 401 so Razorpay does not keep retrying a payload we will
    // never accept.
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const payload = req.body as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            status?: string;
          };
        };
      };
    };

    const event = payload.event;
    const payment = payload.payload?.payment?.entity;

    if (!event || !payment?.order_id) {
      // Acknowledge so Razorpay stops retrying an event we do not handle.
      return res.status(200).json({ message: 'Ignored' });
    }

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId: payment.order_id },
      select: { id: true, orderId: true, totalAmount: true, paymentStatus: true },
    });

    if (!order) {
      logger.warn({
        event: 'razorpay_webhook_unknown_order',
        razorpayOrderId: payment.order_id,
      });
      return res.status(200).json({ message: 'Unknown order' });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      // Confirm the captured amount matches what the order is actually worth.
      const expectedPaise = Math.round(order.totalAmount * 100);

      if (typeof payment.amount === 'number' && payment.amount < expectedPaise) {
        logger.error({
          event: 'razorpay_webhook_amount_mismatch',
          orderId: order.orderId,
          expected: expectedPaise,
          received: payment.amount,
        });
        return res.status(200).json({ message: 'Amount mismatch' });
      }

      if (order.paymentStatus !== 'SUCCESS') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'SUCCESS',
            razorpayPaymentId: payment.id || undefined,
          },
        });
      }

      logger.info({ event: 'razorpay_webhook_captured', orderId: order.orderId });
      return res.status(200).json({ message: 'Payment recorded' });
    }

    if (event === 'payment.failed') {
      // Never downgrade an order that is already paid - a later failed retry
      // must not undo a successful capture.
      if (order.paymentStatus === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'FAILED',
            razorpayPaymentId: payment.id || undefined,
          },
        });
      }

      logger.info({ event: 'razorpay_webhook_failed', orderId: order.orderId });
      return res.status(200).json({ message: 'Failure recorded' });
    }

    return res.status(200).json({ message: 'Ignored' });
  } catch (error: any) {
    logger.error({ event: 'razorpay_webhook_error', message: error?.message });
    // 500 so Razorpay retries a delivery we failed to process.
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
