import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.patch('/', async (req: Request, res: Response) => {
  try {
      const { id  } = req.params;
      
      const authHeader = req.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  
      // Only super admin can toggle sub-admins
      if (!decoded.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      // Get current sub-admin status
      const subAdmin = await prisma.user.findUnique({
        where: { id },
      });
  
      if (!subAdmin) {
        return res.status(404).json({ message: "Sub-admin not found" });
      }
  
      // Toggle the isActive status
      const updatedSubAdmin = await prisma.user.update({
        where: { id },
        data: {
          isActive: !(subAdmin as any).isActive,
        },
      });
  
      return res.json({
        message: (updatedSubAdmin as any).isActive ? "Sub-admin enabled" : "Sub-admin disabled",
        subAdmin: {
          id: updatedSubAdmin.id,
          name: updatedSubAdmin.name,
          email: updatedSubAdmin.email,
          isActive: (updatedSubAdmin as any).isActive,
        },
      });
    } catch (error: any) {
      console.error("Toggle Sub-admin Error:", error);
      return res.status(500).json({ message: "Error toggling sub-admin status" });
    }
  });

export default router;
