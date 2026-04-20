import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router({ mergeParams: true });

router.put('/', async (req: Request, res: Response) => {
  try {
      const { id  } = req.params;
      
      const authHeader = req.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  
      // Only super admin can update sub-admins
      if (!decoded.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      const { name, email, mobile, permissions, password } = req.body;

      // Validation
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }

      if (!mobile || mobile.trim().length < 10) {
        return res.status(400).json({ message: "Mobile number must be at least 10 digits" });
      }
  
      const updateData: any = {
        name: name.trim(),
        mobile: mobile.trim(),
      };

      // Only update email if provided and different
      if (email && email.trim()) {
        updateData.email = email.trim();
      }

      // Only add permissions if provided
      if (permissions) {
        updateData.permissions = permissions;
      }
  
      // If password is provided, hash it and update
      if (password && password.length >= 6) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        return res.status(404).json({ message: "Sub-admin not found" });
      }
  
      const subAdmin = await prisma.user.update({
        where: { id },
        data: updateData,
      });
  
      return res.json({
        message: "Sub-admin updated successfully",
        subAdmin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          mobile: subAdmin.mobile,
          isActive: (subAdmin as any).isActive,
          permissions: (subAdmin as any).permissions,
        },
      });
    } catch (error: any) {
      console.error("Update Sub-admin Error:", error.message);
      return res.status(500).json({ message: "Error updating sub-admin: " + error.message });
    }
  });

router.delete('/', async (req: Request, res: Response) => {
  try {
      const { id  } = req.params;
      
      const authHeader = req.get("authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  
      // Only super admin can delete sub-admins
      if (!decoded.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      await prisma.user.delete({
        where: { id },
      });
  
      return res.json({ message: "Sub-admin deleted successfully" });
    } catch (error: any) {
      console.error("Delete Sub-admin Error:", error);
      return res.status(500).json({ message: "Error deleting sub-admin" });
    }
  });

export default router;
