import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  console.log("🔄 Bulk update POST received");

  let updates: Array<{ id: string; changes: any }> = [];

  try {
    console.log("✅ Auth check starting...");
    await verifyAdmin(req);
    console.log("✅ Auth passed");

    const body = await req.json();
    console.log("📦 Body received:", body);

    updates = body.updates as Array<{ id: string; changes: any }>;

    if (!Array.isArray(updates) || updates.length === 0) {
      console.log("❌ Invalid updates array");
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    if (updates.length > 100) {
      console.log(`⚠️ Large bulk update: ${updates.length} products`);
    }

    // Validate all IDs exist first
    const productIds = updates.map(u => u.id);
    console.log("🔍 Checking product IDs:", productIds);
    
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });

    const existingIds = new Set(existingProducts.map(p => p.id));
    const missingIds = updates
      .filter(u => !existingIds.has(u.id))
      .map(u => u.id);

    if (missingIds.length > 0) {
      console.log("❌ Missing products:", missingIds);
      return NextResponse.json(
        { error: "Some products not found", missing: missingIds },
        { status: 404 }
      );
    }

    console.log("✅ All products exist, starting transaction...");
    
    // Atomic transaction
    const results = await prisma.$transaction(
      updates.map(({ id, changes }) =>
        prisma.product.update({
          where: { id },
          data: changes,
        })
      )
    );

    console.log(`✅ Transaction complete: ${results.length} updated`);

    return NextResponse.json({
      success: results.length,
      failed: 0,
      updated: results.length,
      products: results
    });

  } catch (error: any) {
    console.error("💥 Bulk update ERROR:", error.message);
    console.error("Full error:", error);
    
    return NextResponse.json(
      { 
        error: "Bulk update failed", 
        details: error.message,
        success: 0,
        failed: updates?.length || 0
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  console.log("🗑️ Bulk delete DELETE received");
  
  try {
    console.log("✅ Auth check starting...");
    await verifyAdmin(req);
    console.log("✅ Auth passed");

    const body = await req.json();
    console.log("📦 Body received:", body);
    
    const productIds = body.productIds as string[];

    if (!Array.isArray(productIds) || productIds.length === 0) {
      console.log("❌ Invalid productIds array");
      return NextResponse.json(
        { error: "Invalid productIds array" },
        { status: 400 }
      );
    }

    if (productIds.length > 100) {
      console.log(`⚠️ Large bulk delete: ${productIds.length} products`);
    }

    // Validate all IDs exist first
    console.log("🔍 Checking product IDs:", productIds);
    
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    });

    const existingIds = new Set(existingProducts.map(p => p.id));
    const missingIds = productIds.filter(id => !existingIds.has(id));

    if (missingIds.length > 0) {
      console.log("❌ Missing products:", missingIds);
      return NextResponse.json(
        { error: "Some products not found", missing: missingIds },
        { status: 404 }
      );
    }

    console.log("✅ All products exist, starting bulk delete...");

    // Delete in transaction: first delete related OrderItems, then products
    const result = await prisma.$transaction(async (tx) => {
      // Delete all OrderItems referencing these products
      const deletedItems = await tx.orderItem.deleteMany({
        where: { productId: { in: productIds } }
      });
      console.log(`🗑️ Deleted ${deletedItems.count} order items`);

      // Then delete the products
      const deletedProducts = await tx.product.deleteMany({
        where: { id: { in: productIds } }
      });
      console.log(`🗑️ Deleted ${deletedProducts.count} products`);

      return deletedProducts;
    });

    console.log(`✅ Bulk delete complete: ${result.count} deleted`);

    return NextResponse.json({
      success: result.count,
      deleted: result.count,
      message: `${result.count} products deleted successfully`
    });

  } catch (error: any) {
    console.error("💥 Bulk delete ERROR:", error.message);
    console.error("Full error:", error);
    
    return NextResponse.json(
      { 
        error: "Bulk delete failed", 
        details: error.message,
        success: 0,
        deleted: 0
      },
      { status: 500 }
    );
  }
}

