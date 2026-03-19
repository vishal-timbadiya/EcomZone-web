import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json([], { status: 200 });
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    const orders = await prisma.order.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}