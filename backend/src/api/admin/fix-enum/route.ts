import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    // Add PACKED to OrderStatus enum if not exists
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE 'PACKED'`);
    } catch (e: any) {
      // Ignore if already exists
      if (!e.message.includes('already exists')) {
        console.log('Enum add error (may already exist):', e.message);
      }
    }

    return NextResponse.json({ success: true, message: "Enum updated" });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}


