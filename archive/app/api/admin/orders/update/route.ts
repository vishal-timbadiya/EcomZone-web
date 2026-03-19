import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    const body = await req.json();
    const { orderId, orderStatus, paymentStatus, courierName, trackingId } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    // Use raw SQL for the update to avoid enum issues
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (orderStatus) {
      // Cast text to enum using :: syntax
      updates.push(`"orderStatus" = $${paramIndex++}::"OrderStatus"`);
      params.push(orderStatus);
    }
    
    if (paymentStatus) {
      updates.push(`"paymentStatus" = $${paramIndex++}::"PaymentStatus"`);
      params.push(paymentStatus);
    }
    
    if (courierName !== undefined) {
      updates.push(`"courierName" = $${paramIndex++}`);
      params.push(courierName);
    }
    
    if (trackingId !== undefined) {
      updates.push(`"trackingId" = $${paramIndex++}`);
      params.push(trackingId);
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ message: "No updates provided" });
    }
    
    params.push(orderId);
    
    await prisma.$executeRawUnsafe(
      `UPDATE "Order" SET ${updates.join(', ')} WHERE "orderId" = $${paramIndex}`,
      ...params
    );

    const updatedOrder = await prisma.order.findUnique({
      where: { orderId },
    });

    return NextResponse.json({
      message: "Order updated successfully",
      updatedOrder,
    });
  } catch (error: any) {
    console.error("Admin Order Update Error:", error.message);

    return NextResponse.json(
      { message: "Unauthorized or update failed" },
      { status: 401 }
    );
  }
}

