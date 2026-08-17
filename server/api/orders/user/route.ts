import { prisma } from '../../../lib/prisma';
import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../lib/middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const auth = requireAuth(req);

      // This endpoint intentionally returns an empty list rather than a 401 for
      // anonymous callers, so the storefront can render without an account.
      if ('error' in auth) {
        return res.status(200).json([]);
      }

      const orders = await prisma.order.findMany({
        where: { userId: auth.user.userId },
        take: 200,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  slug: true,
                },
              },
            },
          },
        },
      });
  
      return res.json(orders);
    } catch {
      return res.status(200).json([]);
    }
  });

export default router;



