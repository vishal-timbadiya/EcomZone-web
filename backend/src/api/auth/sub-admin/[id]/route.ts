import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// PUT - Update sub-admin (only for super admin)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Only super admin can update sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { name, email, mobile, permissions, password } = await req.json();

    const updateData: any = {
      name,
      email,
      mobile,
      permissions,
    };

    // If password is provided, hash it and update
    if (password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
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
    console.error("Update Sub-admin Error:", error);
    return NextResponse.json(
      { message: "Error updating sub-admin" },
      { status: 500 }
    );
  }
}

// DELETE - Delete sub-admin (only for super admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Only super admin can delete sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

