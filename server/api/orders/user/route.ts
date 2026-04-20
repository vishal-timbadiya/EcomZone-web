import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const authHeader = req.get("authorization");
  
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(200).json([]);
      }
  
      const token = authHeader.split(" ")[1];
  
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET!
      );
  
      const orders = await prisma.order.findMany({
        where: { userId: decoded.userId },
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
