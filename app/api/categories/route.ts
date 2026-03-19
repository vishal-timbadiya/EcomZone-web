import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string | null;
  productCount: number;
}

export async function GET() {
  try {
    // Get categories from the Category table ordered by position
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' }
    });

    if (categories.length === 0) {
      return NextResponse.json([]);
    }

    // Get product counts for each category
    const categoryCounts: CategoryWithCount[] = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.product.count({
          where: {
            OR: [
              { category: category.slug },
              { categories: { has: category.slug } }
            ],
            isActive: true
          }
        });

        return {
          ...category,
          productCount: count
        };
      })
    );

    return NextResponse.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}

