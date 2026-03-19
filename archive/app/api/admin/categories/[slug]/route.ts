import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '@/lib/adminAuth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const { slug } = await params;

    // Get category
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Get all products in category (active/inactive)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { category: slug },
          { categories: { has: slug } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.product.count({
      where: {
        OR: [
          { category: slug },
          { categories: { has: slug } }
        ]
      }
    });

    return NextResponse.json({
      category,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching admin category products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

