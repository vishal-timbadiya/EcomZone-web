import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "Cart is empty" },
        { status: 400 }
      );
    }

    let cartSubtotal = 0;
    let cartGST = 0;

    const detailedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }

      const singleQty = item.singleQty || 0;
      const cartonQty = item.cartonQty || 0;

      const singleTotal = singleQty * product.singlePrice;
      const cartonTotal = cartonQty * product.cartonPrice;

      const itemSubtotal = singleTotal + cartonTotal;
      const itemGST = (itemSubtotal * product.gstPercentage) / 100;

      cartSubtotal += itemSubtotal;
      cartGST += itemGST;

      detailedItems.push({
        productId: product.id,
        name: product.name,
        singleQty,
        cartonQty,
        itemSubtotal,
        itemGST,
      });
    }

    const cartTotal = cartSubtotal + cartGST;

    if (cartTotal < 2500) {
      return NextResponse.json(
        {
          message: "Minimum order value is ₹2500",
          cartSubtotal,
          cartGST,
          cartTotal,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Cart calculated successfully",
      cartSubtotal,
      cartGST,
      cartTotal,
      items: detailedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Cart calculation failed", error: error.message },
      { status: 500 }
    );
  }
}