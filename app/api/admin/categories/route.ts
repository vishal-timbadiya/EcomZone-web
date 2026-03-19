"use server"

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { verifyAdmin } from '@/lib/adminAuth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ADMIN-CATEGORIES-GET] Fetching categories...');
    
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' }
    });

    console.log(`[ADMIN-CATEGORIES-GET] Found ${categories.length} categories:`, categories);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[ADMIN-CATEGORIES-GET] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg, type: 'query_error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon = '📦', imageUrl = '' } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Category name is required (min 2 chars)' }, { status: 400 });
    }

    const slug = name.trim().toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    }

    // Get the next position
    const maxPosition = await prisma.category.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    const nextPosition = (maxPosition?.position ?? -1) + 1;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        icon,
        imageUrl,
        position: nextPosition
      }
    });

    console.log(`[ADMIN-CATEGORIES-CREATE] Created category:`, category);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

