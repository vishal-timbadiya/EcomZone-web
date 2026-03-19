import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { orderId, orderStatus, courierName, trackingId } =
    await req.json();

  try {
    const updated = await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus,
        courierName,
        trackingId,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}