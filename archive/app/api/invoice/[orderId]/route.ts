import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750;

    page.drawText("ECOMZONE INVOICE", {
      x: 50,
      y,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    page.drawText(`Order ID: ${order.orderId}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`Date: ${new Date(order.createdAt).toDateString()}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 40;

    page.drawText("Items:", {
      x: 50,
      y,
      size: 14,
      font,
    });

    y -= 25;

    order.items.forEach((item, index) => {
      page.drawText(
        `${index + 1}. ${item.product.name} | Qty: ${item.quantity} | Rs ${item.price}`,
        {
          x: 60,
          y,
          size: 12,
          font,
        }
      );
      y -= 20;
    });

    y -= 20;

    page.drawText(`Subtotal: Rs ${order.subtotal}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`GST: Rs ${order.gstAmount}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`Total: Rs ${order.totalAmount}`, {
      x: 50,
      y,
      size: 14,
      font,
    });

    const pdfBytes = await pdfDoc.save();

// ✅ Force strict Uint8Array<ArrayBuffer>
const safeBytes = Uint8Array.from(pdfBytes);

return new Response(safeBytes, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
  },
});
  } catch (error: any) {
    console.error("INVOICE ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Invoice failed" },
      { status: 500 }
    );
  }
}