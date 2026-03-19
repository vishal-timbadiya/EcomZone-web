import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAdmin(req);

    const body = await req.json();
    const {
      productCode,
      name,
      description,
      imageUrl,
      imageUrls,
      singlePrice,
      cartonPrice,
      cartonPcsPrice,
      cartonQty,
      gstPercentage,
      hsnCode,
      weight,
      stock,
      category,
      categories,
      subCategory,
      isBestseller,
      isNewArrival,
      isTopRanking,
    } = body;

    // Get the existing product to preserve its slug if name hasn't changed
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { slug: true, name: true }
    });

    let slug = existingProduct?.slug || "";

    // Only regenerate slug if name changed
    if (name !== existingProduct?.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      // Check if slug already exists (excluding current product)
      const existingWithSlug = await prisma.product.findFirst({
        where: { slug, NOT: { id } }
      });

      if (existingWithSlug) {
        // Add a unique suffix
        slug = `${slug}-${Date.now()}`;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        productCode: productCode || null,
        name,
        slug,
        description,
        imageUrl: imageUrl || "",
        imageUrls: imageUrls || [],
        singlePrice: singlePrice || 0,
        cartonPrice: cartonPrice || 0,
        cartonPcsPrice: cartonPcsPrice || 0,
        cartonQty: cartonQty || 1,
        gstPercentage: gstPercentage || 0,
        hsnCode: hsnCode || "",
        weight: weight || 0,
        stock: stock || 0,
        category: (category || "general").toLowerCase().replace(/\s+/g, "-"),
        categories: categories || [],
        subCategory: subCategory || "basic",
        isBestseller: isBestseller || false,
        isNewArrival: isNewArrival || false,
        isTopRanking: isTopRanking || false,
      },
    });

    return NextResponse.json({
      message: "Product updated",
      product,
    });
  } catch (error: any) {
    console.error("Update Product Error:", error.message);
    console.error("Error details:", error);
    return NextResponse.json(
      { message: `Error updating product: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await verifyAdmin(req);

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error: any) {
    console.error("Delete Product Error:", error.message);
    return NextResponse.json(
      { message: "Error deleting product" },
      { status: 500 }
    );
  }
}
