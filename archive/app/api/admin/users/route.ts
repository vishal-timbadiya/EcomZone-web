import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { decryptPassword } from "@/lib/encryption";

export async function GET(req: Request) {
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        password: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Decrypt passwords for admin display
    const usersWithDecryptedPassword = users.map((user) => ({
      ...user,
      password: user.password ? decryptPassword(user.password) : "",
    }));

    return NextResponse.json({ users: usersWithDecryptedPassword });
  } catch (error: any) {
    console.error("Get Users Error:", error);
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}
