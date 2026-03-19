import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import jwt from "jsonwebtoken";

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  permissions: any;
}

// GET - List all sub-admins (only for super admin)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Only super admin can list sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ subAdmins });
  } catch (error: any) {
    return NextResponse.json({ message: "Error fetching sub-admins" }, { status: 500 });
  }
}

// POST - Create new sub-admin (only for super admin)
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Only super admin can create sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { name, email, mobile, password, permissions } = await req.json();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or mobile already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = encryptPassword(password);

    const subAdmin = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: hashedPassword,
        role: "ADMIN",
        isSuperAdmin: false,
        isActive: true,
        permissions,
      },
    });

    return NextResponse.json({
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
    console.error("Create Sub-admin Error:", error);
    return NextResponse.json(
      { message: "Error creating sub-admin" },
      { status: 500 }
    );
  }
}

