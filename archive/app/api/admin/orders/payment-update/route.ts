import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = requireAdmin(req);

  if ("error" in auth) {
    return NextResponse.json(
      { message: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { orderId, paymentStatus } = await req.json();

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { message: "orderId and paymentStatus required" },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { orderId },
      data: { paymentStatus },
    });

    return NextResponse.json({
      message: "Payment status updated",
      updated,
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Payment update failed", error: error.message },
      { status: 500 }
    );
  }
}