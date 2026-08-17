import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { hashPassword } from '@/lib/password';
import { extractBearerToken, verifyAuthToken } from '@/lib/jwt';
import { enforceRateLimit, SUB_ADMIN_LIMIT } from '@/lib/rateLimit';

function getTokenFromRequest(request: NextRequest): string | null {
  return extractBearerToken(request.headers.get('authorization'));
}

const verifyToken = verifyAuthToken;

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, SUB_ADMIN_LIMIT);
  if (limited) return limited;

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
    console.error("Fetch sub-admins error:", error?.message);
    return NextResponse.json({ message: "Error fetching sub-admins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, SUB_ADMIN_LIMIT);
  if (limited) return limited;

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

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
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

    const hashedPassword = await hashPassword(password);

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
    console.error("Create Sub-admin Error:", error?.message);
    return NextResponse.json({ message: "Error creating sub-admin" }, { status: 500 });
  }
}