import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const categories = searchParams.get("categories"); // Multiple categories comma-separated
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const type = searchParams.get("type"); // Filter by product type: top-ranking, trending, new-arrivals

    // Build where clause
    const where: any = { isActive: true };
    
    // Filter by product type
    if (type === "top-ranking") {
      where.isTopRanking = true;
    } else if (type === "trending") {
      where.isBestseller = true;
    } else if (type === "new-arrivals") {
      where.isNewArrival = true;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Support both single category and multiple categories
    if (categories) {
      const categoryList = categories.split(",").map(c => c.trim());
      where.categories = { hasSome: categoryList };
    } else if (category) {
      // For backward compatibility - check both single category and categories array
      where.OR = [
        { category: category },
        { categories: { has: category } }
      ];
    }
    
    if (minPrice || maxPrice) {
      where.singlePrice = {};
      if (minPrice) where.singlePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.singlePrice.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
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

    return NextResponse.json(transformedProducts);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Error fetching products", error: error.message },
      { status: 500 }
    );
  }
}

