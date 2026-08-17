import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return res.status(auth.status).json({ message: auth.error });
  }

  try {
    // The token claim is `userId`. This previously read `auth.user.id`, which is
    // always undefined - and Prisma DROPS undefined filters rather than matching
    // nothing, so the where clause disappeared and the endpoint returned every
    // order in the database to any authenticated caller.
    const userId = auth.user.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.json(orders);
  } catch (error: any) {
    console.error('Fetch Orders Error:', error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

export default router;
