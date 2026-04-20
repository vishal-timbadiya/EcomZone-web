import { prisma } from '@/lib/prisma';
import { encryptPassword } from '@/lib/encryption';
import jwt from "jsonwebtoken";
import { Router, Request, Response } from 'express';

const router = Router();

router.post("/:id", async (req: Request, res: Response) => {
  try {
    const authHeader = req.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Check if super admin or has manageUsers permission
    if (!decoded.isSuperAdmin && !decoded.permissions?.manageUsers) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Encrypt the new password before storing
    const encryptedPassword = encryptPassword(newPassword);

    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: encryptedPassword },
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return res.status(error.status || 500).json({
      message: "Error resetting password",
    });
  }
});

export default router;
