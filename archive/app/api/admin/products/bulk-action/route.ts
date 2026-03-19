import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { productIds, action, data } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: "No products selected" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ success: false, message: "No action specified" }, { status: 400 });
    }

    const updateData: any = {};

    switch (action) {
      case "setActive":
        updateData.isActive = data.isActive;
        break;
      case "setBestseller":
        updateData.isBestseller = data.isBestseller;
        break;
      case "setNewArrival":
        updateData.isNewArrival = data.isNewArrival;
        break;
      case "setTopRanking":
        updateData.isTopRanking = data.isTopRanking;
        break;
      case "setCategory":
        updateData.category = data.category;
        break;
      case "setCategories":
        updateData.categories = data.categories || [];
        break;
      case "setStock":
        updateData.stock = data.stock;
        break;
      case "setHSN":
        updateData.hsnCode = data.hsnCode;
        break;
      case "setPrice":
        updateData.singlePrice = data.singlePrice;
        break;
      case "setWeight":
        updateData.weight = data.weight;
        break;
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} products updated`
    });

  } catch (error: any) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: "No products selected" }, { status: 400 });
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} products deleted`
    });

  } catch (error: any) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
