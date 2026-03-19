import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = requireAuth(req);

  if ("error" in auth) {
    return NextResponse.json(
      { message: auth.error },
      { status: auth.status }
    );
  }

  try {
    const userId = (auth.user as any).id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);

  } catch (error: any) {
    console.error("Fetch Orders Error:", error);

    return NextResponse.json(
      { message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}