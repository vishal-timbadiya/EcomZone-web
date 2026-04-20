import { prisma } from '@/lib/prisma';
import { decryptPassword, encryptPassword } from '@/lib/encryption';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        password: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Decrypt passwords for admin display
    const usersWithDecryptedPassword = users.map((user) => ({
      ...user,
      password: user.password ? decryptPassword(user.password) : "",
    }));

    return res.json({ users: usersWithDecryptedPassword });
  } catch (error: any) {
    console.error("Get Users Error:", error);
    return res.status(error.status || 500).json({ message: error.message || "Error fetching users" });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    await verifyAdmin(req);

    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Encrypt password before storing
    const encryptedPassword = encryptPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        mobile: mobile || "",
        password: encryptedPassword,
        role: role || "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return res.status(error.status || 500).json({ message: "Error creating user", error: error.message });
  }
});

export default router;
