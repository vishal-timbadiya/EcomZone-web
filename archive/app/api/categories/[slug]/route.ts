import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');

    // Get category by slug
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get products for this category
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: slug },
              { categories: { has: slug } }
            ]
          }
        ]
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        productCode: true,
        imageUrl: true,
        singlePrice: true,
        cartonPrice: true,
        cartonQty: true,
        gstPercentage: true,
        category: true,
        stock: true,
        isBestseller: true,
        isNewArrival: true,
        isTopRanking: true,
        description: true
      }
    });

    // Get total count for pagination
    const total = await prisma.product.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: slug },
              { categories: { has: slug } }
            ]
          }
        ]
      }
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon
      },
      products,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: String(error) },
      { status: 500 }
    );
  }
}
