import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error: any) {
    console.error("Get User Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error fetching user" });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    const body = req.body;
    const { name, email, mobile } = body;

    // Fetch current user to compare with existing data
    const currentUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email or mobile already exists for ANOTHER user (only if they changed)
    if ((email && email !== currentUser.email) || (mobile && mobile !== currentUser.mobile)) {
      const whereConditions: any[] = [];
      
      if (email && email !== currentUser.email) {
        whereConditions.push({ email: email });
      }
      if (mobile && mobile !== currentUser.mobile) {
        whereConditions.push({ mobile: mobile });
      }

      if (whereConditions.length > 0) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { OR: whereConditions },
              { NOT: { id: id } }
            ]
          }
        });

        if (existingUser) {
          return res.status(400).json({ message: "Email or mobile already exists for another user" });
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name || currentUser.name,
        email: email || currentUser.email,
        mobile: mobile || currentUser.mobile,
      },
    });

    return res.json({
      message: "User updated",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Update User Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error updating user" });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    // Check if user has any orders
    const orders = await prisma.order.findMany({
      where: { userId: id },
    });

    if (orders.length > 0) {
      return res.status(400).json({ message: "Cannot delete user with existing orders" });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.json({ message: "User deleted" });
  } catch (error: any) {
    console.error("Delete User Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error deleting user" });
  }
});

export default router;
