import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Transform products to ensure proper JSON serialization
    const transformedProducts = products.map((product: any) => ({
      ...product,
      categories: Array.isArray(product.categories) 
        ? product.categories 
        : [],
      imageUrls: Array.isArray(product.imageUrls) 
        ? product.imageUrls 
        : product.imageUrls 
          ? JSON.parse(JSON.stringify(product.imageUrls)) 
          : [],
    }));

    return NextResponse.json({ products: transformedProducts });
  } catch (error: any) {
    console.error("Admin Products GET Error:", error.message);
    return NextResponse.json(
      { message: "Unauthorized or error fetching products" },
      { status: 401 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    // Generate base slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    let slug = baseSlug;
    let counter = 0;

    // Check for existing slug and make it unique
    while (await prisma.product.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const product = await prisma.product.create({
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
      message: "Product created",
      product,
    });
  } catch (error: any) {
    console.error("Admin Product Error:", error.message);
    console.error("Error details:", error);

    return NextResponse.json(
      { message: `Error creating product: ${error.message}` },
      { status: 500 }
    );
  }
}
