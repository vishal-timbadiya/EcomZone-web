import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action'); // 'activate', 'deactivate', 'delete'
    const id = searchParams.get('id');

    // View all categories (including hidden ones)
    if (!action) {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        categories,
        note: 'All categories shown - some may be inactive or hidden'
      });
    }

    // Activate a category
    if (action === 'activate' && id) {
      const updated = await prisma.category.update({
        where: { id },
        data: { isActive: true }
      });
      return NextResponse.json({ message: 'Category activated', category: updated });
    }

    // Deactivate a category
    if (action === 'deactivate' && id) {
      const updated = await prisma.category.update({
        where: { id },
        data: { isActive: false }
      });
      return NextResponse.json({ message: 'Category deactivated', category: updated });
    }

    // Delete a category (dangerous - no product check)
    if (action === 'delete' && id) {
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ message: 'Category deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin recovery error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
