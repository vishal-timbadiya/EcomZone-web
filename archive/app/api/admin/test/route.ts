import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    // Get ALL categories in database
    const allCategories = await prisma.category.findMany({
      orderBy: { position: 'asc' }
    });

    if (!slug) {
      return NextResponse.json({
        message: 'All categories in database',
        totalCount: allCategories.length,
        categories: allCategories
      });
    }

    // Get specific category
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found', slug });
    }

    // Get products that match this category
    const matchingProducts = await prisma.product.findMany({
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
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        categories: true
      }
    });

    // Get all unique category values in DB
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true }
    });

    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];

    return NextResponse.json({
      slug,
      category,
      matchingProductsCount: matchingProducts.length,
      matchingProducts,
      allUniqueCategories: uniqueCategories
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}