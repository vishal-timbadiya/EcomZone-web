import { NextResponse } from "next/server";

export const dynamic = "force-static";

// Order updates are handled by the Express backend at /api/admin/orders/update
// This static GET handler keeps the file compatible with next output: export
export async function GET() {
  return NextResponse.json(
    { message: "Use POST /api/admin/orders/update via the backend API" },
    { status: 200 }
  );
}