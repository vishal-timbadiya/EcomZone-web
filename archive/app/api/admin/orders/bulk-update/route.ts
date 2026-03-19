import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    const body = await req.json();
    const { orderIds, orderStatus, paymentStatus, courierName, trackingId } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { message: "No orders specified" },
        { status: 400 }
      );
    }

    if (!orderStatus && !paymentStatus && !courierName && !trackingId) {
      return NextResponse.json(
        { message: "Please specify at least one field to update" },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};
    
    if (orderStatus) {
      // Map string to Prisma enum - use type assertion
      const statusMap: Record<string, any> = {
        "CONFIRMED": OrderStatus.CONFIRMED,
        "PACKED": "PACKED", // Will work after database is updated
        "DISPATCHED": OrderStatus.DISPATCHED,
        "DELIVERED": OrderStatus.DELIVERED,
        "CANCELLED": OrderStatus.CANCELLED,
      };
      updateData.orderStatus = statusMap[orderStatus] || orderStatus;
    }
    
    if (paymentStatus) {
      const paymentMap: Record<string, any> = {
        "PENDING": PaymentStatus.PENDING,
        "SUCCESS": PaymentStatus.SUCCESS,
        "FAILED": PaymentStatus.FAILED,
      };
      updateData.paymentStatus = paymentMap[paymentStatus] || paymentStatus;
    }
    
    if (courierName !== undefined) {
      updateData.courierName = courierName || null;
    }
    
    if (trackingId !== undefined) {
      updateData.trackingId = trackingId || null;
    }

    // Update each order using Prisma
    let updatedCount = 0;
    
    for (const orderId of orderIds) {
      try {
        await prisma.order.update({
          where: { orderId },
          data: updateData,
        });
        updatedCount++;
      } catch (err) {
        console.error(`Error updating order ${orderId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} order(s)`,
      updatedCount,
    });
  } catch (error: any) {
    console.error("Bulk Update Error:", error);
    return NextResponse.json(
      { message: "Error updating orders: " + error.message, error: error.message },
      { status: 500 }
    );
  }
}

