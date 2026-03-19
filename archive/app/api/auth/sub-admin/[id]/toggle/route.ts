import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// PATCH - Toggle sub-admin active status (only for super admin)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Only super admin can toggle sub-admins
    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get current sub-admin status
    const subAdmin = await prisma.user.findUnique({
      where: { id },
    });

    if (!subAdmin) {
      return NextResponse.json({ message: "Sub-admin not found" }, { status: 404 });
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

