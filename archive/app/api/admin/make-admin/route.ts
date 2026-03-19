import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  await prisma.user.update({
    where: { email: "vishal@test.com" },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ message: "User promoted to ADMIN" });
}