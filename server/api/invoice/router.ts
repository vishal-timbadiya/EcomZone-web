import { prisma } from "@/lib/prisma";
import { Router } from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const router = Router();

router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

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
      return res.status(404).json({
        error: "Order not found"
      });
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

    return res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${orderId}.pdf`,
    }).send(safeBytes);
  } catch (error: any) {
    console.error("INVOICE ERROR:", error);

    return res.status(500).json({
      error: error.message || "Invoice failed"
    });
  }
});

export default router;
