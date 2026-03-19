import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, mobile } = body;

    if (!orderId || !mobile) {
      return NextResponse.json(
        { message: "Order ID and mobile are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user.mobile !== mobile) {
      return NextResponse.json(
        { message: "Invalid mobile number" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      courierName: order.courierName,
      trackingId: order.trackingId,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Tracking failed", error: error.message },
      { status: 500 }
    );
  }
}