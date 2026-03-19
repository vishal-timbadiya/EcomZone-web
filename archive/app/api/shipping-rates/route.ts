import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const city = searchParams.get("city");

    const where: any = { isActive: true };
    if (state) where.state = state;
    if (city) where.city = city;

    const rates = await prisma.shippingRate.findMany({ where });
    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return NextResponse.json({ error: "Failed to fetch shipping rates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { state, city, ratePerKg } = body;

    if (!state || ratePerKg === undefined) {
      return NextResponse.json({ error: "State and rate per kg are required" }, { status: 400 });
    }

    // Check if rate already exists
    const existing = await prisma.shippingRate.findFirst({
      where: { state, city: city || null }
    });

    if (existing) {
      // Update existing rate
      const updated = await prisma.shippingRate.update({
        where: { id: existing.id },
        data: { ratePerKg }
      });
      return NextResponse.json({ rate: updated });
    }

    // Create new rate
    const rate = await prisma.shippingRate.create({
      data: {
        state,
        city: city || null,
        ratePerKg
      }
    });

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Error creating shipping rate:", error);
    return NextResponse.json({ error: "Failed to create shipping rate" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, state, city, ratePerKg, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Rate ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (state) updateData.state = state;
    if (city !== undefined) updateData.city = city || null;
    if (ratePerKg !== undefined) updateData.ratePerKg = ratePerKg;
    if (isActive !== undefined) updateData.isActive = isActive;

    const rate = await prisma.shippingRate.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Error updating shipping rate:", error);
    return NextResponse.json({ error: "Failed to update shipping rate" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAuth(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rate ID is required" }, { status: 400 });
    }

    await prisma.shippingRate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipping rate:", error);
    return NextResponse.json({ error: "Failed to delete shipping rate" }, { status: 500 });
  }
}

