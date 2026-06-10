import { prisma } from '@/server/lib/prisma';
import { encryptPassword } from '@/lib/encryption';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper to get token from Authorization header
function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}

// Helper to verify token
function verifyToken(token: string): any {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error: any) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Only super admin can list sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Only super admin can access this" },
        { status: 403 }
      );
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
    console.error("Fetch sub-admins error:", error.message, error.stack);
    return NextResponse.json(
      { message: "Error fetching sub-admins", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Only super admin can create sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden: Only super admin can access this" },
        { status: 403 }
      );
    }

    const { name, email, mobile, password, permissions } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

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
        mobile: mobile || "",
        password: hashedPassword,
        role: "ADMIN",
        isSuperAdmin: false,
        isActive: true,
        permissions: permissions || null,
      },
    });

    return NextResponse.json(
      {
        message: "Sub-admin created successfully",
        subAdmin: {
          id: subAdmin.id,
          name: subAdmin.name,
          email: subAdmin.email,
          mobile: subAdmin.mobile,
          isActive: subAdmin.isActive,
          permissions: subAdmin.permissions,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create Sub-admin Error:", error.message, error.stack);
    return NextResponse.json(
      { message: "Error creating sub-admin", error: error.message },
      { status: 500 }
    );
  }
}