import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '@/lib/adminAuth';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon, imageUrl } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Category name is required (min 2 chars)' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if another category has this slug
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        icon,
        imageUrl
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: {
        OR: [
          { category: { equals: await prisma.category.findUnique({ where: { id }, select: { slug: true } }).then(c => c?.slug) } },
          { categories: { has: await prisma.category.findUnique({ where: { id }, select: { slug: true } }).then(c => c?.slug) } }
        ]
      }
    });

    if (productCount > 0) {
      return NextResponse.json({
        error: `Cannot delete category with ${productCount} products. Remove products first.`
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    const category = await prisma.category.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error toggling category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, direction } = body;

    if (!id || !direction) {
      return NextResponse.json({ error: 'id and direction required' }, { status: 400 });
    }

    // Get current category
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (direction === 'up') {
      // Find category with position less than current, order by position desc (closest one)
      const prev = await prisma.category.findFirst({
        where: { position: { lt: current.position } },
        orderBy: { position: 'desc' }
      });

      if (!prev) {
        return NextResponse.json({ error: 'Already at top' }, { status: 400 });
      }

      // Swap positions
      await prisma.category.update({ where: { id: current.id }, data: { position: prev.position } });
      await prisma.category.update({ where: { id: prev.id }, data: { position: current.position } });
    } else if (direction === 'down') {
      // Find category with position greater than current, order by position asc (closest one)
      const next = await prisma.category.findFirst({
        where: { position: { gt: current.position } },
        orderBy: { position: 'asc' }
      });

      if (!next) {
        return NextResponse.json({ error: 'Already at bottom' }, { status: 400 });
      }

      // Swap positions
      await prisma.category.update({ where: { id: current.id }, data: { position: next.position } });
      await prisma.category.update({ where: { id: next.id }, data: { position: current.position } });
    } else {
      return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
    }

    // Return updated categories in new order
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' }
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}