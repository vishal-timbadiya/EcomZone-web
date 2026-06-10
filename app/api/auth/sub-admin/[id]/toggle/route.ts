import { prisma } from '@/server/lib/prisma';
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only super admin can toggle sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Get current sub-admin status
    const subAdmin = await prisma.user.findUnique({
      where: { id },
    });

    if (!subAdmin) {
      return NextResponse.json(
        { message: "Sub-admin not found" },
        { status: 404 }
      );
    }

    // Toggle the isActive status
    const updatedSubAdmin = await prisma.user.update({
      where: { id },
      data: {
        isActive: !(subAdmin as any).isActive,
      },
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { message: "Error toggling sub-admin status" },
      { status: 500 }
    );
  }
}