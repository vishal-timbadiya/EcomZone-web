import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    return res.json({ message: `User ${email} promoted to ADMIN`, user: updatedUser });
  } catch (error: any) {
    console.error("Make Admin Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error promoting user to admin" });
  }
});

export default router;
