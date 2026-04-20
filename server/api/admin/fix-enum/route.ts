import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      // Add PACKED to OrderStatus enum if not exists
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE 'PACKED'`);
      } catch (e: any) {
        // Ignore if already exists
        if (!e.message.includes('already exists')) {
          console.log('Enum add error (may already exist):', e.message);
        }
      }
  
      return res.json({ success: true, message: "Enum updated" });
    } catch (error: any) {
      console.error("Error:", error);
      return res.status(error.status || 500).json({ message: error.message });
    }
  });

export default router;
