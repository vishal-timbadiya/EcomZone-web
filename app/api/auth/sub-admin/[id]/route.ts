import { prisma } from '@/server/lib/prisma';
import { extractBearerToken, verifyAuthToken } from '@/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';

// Helper to get token from Authorization header
function getTokenFromRequest(request: NextRequest): string | null {
  return extractBearerToken(request.headers.get('authorization'));
}

// Helper to verify token
const verifyToken = verifyAuthToken;

export async function PUT(
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

    // Only super admin can update sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const { name, email, mobile, permissions, password } = await request.json();

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!mobile || mobile.trim().length < 10) {
      return NextResponse.json(
        { message: "Mobile number must be at least 10 digits" },
        { status: 400 }
      );
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
      const hashedPassword = await hashPassword(password);
      updateData.password = hashedPassword;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Sub-admin not found" },
        { status: 404 }
      );
    }

    const subAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { message: "Error updating sub-admin: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Only super admin can delete sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sub-admin deleted successfully" });
  } catch (error: any) {
    console.error("Delete Sub-admin Error:", error);
    return NextResponse.json(
      { message: "Error deleting sub-admin" },
      { status: 500 }
    );
  }
}