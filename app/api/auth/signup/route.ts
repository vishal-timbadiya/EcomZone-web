import { prisma } from "@/lib/prisma";
import { encryptPassword } from "@/lib/encryption";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, mobile, password } = await req.json();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Store password as encrypted (for security + admin can decrypt)
    const encryptedPassword = encryptPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: encryptedPassword,
      },
    });

    return NextResponse.json({ message: "User created", user });
  } catch (error: any) {
  console.error("Signup Error:", error);
  return NextResponse.json(
    { message: "Error creating user", error: error.message },
    { status: 500 }
  );
}
}
