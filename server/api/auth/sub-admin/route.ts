import { prisma } from '@/lib/prisma';
import { encryptPassword } from '@/lib/encryption';
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError: any) {
      console.error("JWT verification failed:", tokenError.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Only super admin can list sub-admins
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden: Only super admin can access this" });
    }

    const subAdmins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isSuperAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        isActive: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ subAdmins });
  } catch (error: any) {
    console.error("Fetch sub-admins error:", error.message, error.stack);
    return res.status(500).json({ message: "Error fetching sub-admins", error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError: any) {
      console.error("JWT verification failed:", tokenError.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Only super admin can create sub-admins
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden: Only super admin can access this" });
    }

    const { name, email, mobile, password, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or mobile already exists" });
    }

    const hashedPassword = encryptPassword(password);

    const subAdmin = await prisma.user.create({
      data: {
        name,
        email,
        mobile: mobile || "",
        password: hashedPassword,
        role: "ADMIN",
        isSuperAdmin: false,
        isActive: true,
        permissions: permissions || null,
      },
    });

    return res.status(201).json({
      message: "Sub-admin created successfully",
      subAdmin: {
        id: subAdmin.id,
        name: subAdmin.name,
        email: subAdmin.email,
        mobile: subAdmin.mobile,
        isActive: subAdmin.isActive,
        permissions: subAdmin.permissions,
      },
    });
  } catch (error: any) {
    console.error("Create Sub-admin Error:", error.message, error.stack);
    return res.status(500).json({ message: "Error creating sub-admin", error: error.message });
  }
});

export default router;
