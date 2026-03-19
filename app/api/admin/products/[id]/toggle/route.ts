import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAdmin(req);

    const body = await req.json();
    const { isActive } = body;

    const product = await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      message: "Product status updated",
      product,
    });
  } catch (error: any) {
    console.error("Toggle Product Error:", error.message);
    return NextResponse.json(
      { message: "Error updating product status" },
      { status: 500 }
    );
  }
}

