import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: { codEnabled: true },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("Admin Settings Fetch Error:", error.message);

    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await verifyAdmin(req);

    const body = await req.json();
    const { codEnabled } = body;

    const existing = await prisma.settings.findFirst();

    if (!existing) {
      return NextResponse.json(
        { message: "Settings not found" },
        { status: 404 }
      );
    }

    const updatedSettings = await prisma.settings.update({
      where: { id: existing.id },
      data: { codEnabled },
    });

    return NextResponse.json({
      message: "Settings updated",
      updatedSettings,
    });
  } catch (error: any) {
    console.error("Admin Settings Update Error:", error.message);

    return NextResponse.json(
      { message: "Unauthorized or update failed" },
      { status: 401 }
    );
  }
}