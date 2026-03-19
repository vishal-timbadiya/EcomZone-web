const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'app', 'api', 'categories', '[slug]');
const filePath = path.join(dir, 'route.ts');

const content = `import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
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
    // Products can have category stored as:
    // 1. Full name (e.g., "House Cleaning") - from seed data
    // 2. In categories array (e.g., ["house-cleaning"])
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: category.name },    // Match by category name
              { category: slug },              // Match by slug
              { categories: { has: category.name } },  // Match in categories array by name
              { categories: { has: slug } }    // Match in categories array by slug
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
        imageUrl: true,
        singlePrice: true,
        category: true,
        stock: true
      }
    });

    // Get total count for pagination
    const total = await prisma.product.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: category.name },
              { category: slug },
              { categories: { has: category.name } },
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
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
`;

// Create directory
fs.mkdirSync(dir, { recursive: true });

// Write file
fs.writeFileSync(filePath, content);

console.log('File created successfully at:', filePath);
