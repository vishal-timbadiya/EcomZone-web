import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const merchantTransactionId =
      body?.data?.merchantTransactionId;

    const paymentState =
      body?.data?.state;

    if (!merchantTransactionId) {
      return NextResponse.json(
        { message: "Invalid webhook" },
        { status: 400 }
      );
    }

    if (paymentState === "COMPLETED") {
      await prisma.order.update({
        where: { orderId: merchantTransactionId },
        data: {
          paymentStatus: PaymentStatus.SUCCESS,
        },
      });
    }

    if (paymentState === "FAILED") {
      await prisma.order.update({
        where: { orderId: merchantTransactionId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json(
      { message: "Webhook failed" },
      { status: 500 }
    );
  }
}