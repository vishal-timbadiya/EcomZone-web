import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAdmin(req);

    const body = await req.json();
    const { name, email, mobile } = body;

    // Check if email or mobile already exists for another user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
        NOT: { id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email or mobile already exists for another user" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        mobile,
      },
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAdmin(req);

    // Check if user has any orders
    const orders = await prisma.order.findMany({
      where: { userId: id },
    });

    if (orders.length > 0) {
      return NextResponse.json(
        { message: "Cannot delete user with existing orders" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    console.error("Delete User Error:", error.message);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 }
    );
  }
}

