import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware';

const router = Router({ mergeParams: true });

/**
 * Fetch a single order.
 *
 * This endpoint used to be completely unauthenticated, returning the shipping
 * and billing addresses, mobile number and GST details for any order id - which
 * were sequential timestamps and therefore enumerable.
 */
router.get('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return res.status(auth.status).json({ message: auth.error });
  }

  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Same response for "does not exist" and "belongs to someone else" so the
    // endpoint cannot be used to probe which order ids are real.
    if (!order || (order.userId !== auth.user.userId && auth.user.role !== 'ADMIN')) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Fetch Order Error:', error);
    return res.status(500).json({ message: 'Error fetching order' });
  }
});

export default router;
