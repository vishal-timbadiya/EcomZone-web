import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptPassword } from "@/lib/encryption";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Check if super admin or has manageUsers permission
    if (!decoded.isSuperAdmin && !decoded.permissions?.manageUsers) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get the user ID from the URL path - parent route
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // The user ID should be in the path like /api/admin/users/[id]/reset-password
    const userIdIndex = pathParts.indexOf('users') + 1;
    const userId = pathParts[userIdIndex];

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Encrypt the new password before storing
    const encryptedPassword = encryptPassword(newPassword);

    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: encryptedPassword },
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { message: "Error resetting password" },
      { status: 500 }
    );
  }
}

