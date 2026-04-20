import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: "Order not found" });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const leftMargin = 50;
    const rightMargin = 562;
    const contentWidth = rightMargin - leftMargin;

    let y = 760;

    // Header - Company Name and Branding
    page.drawRectangle({
      x: leftMargin,
      y: y - 50,
      width: contentWidth,
      height: 50,
      color: rgb(0.016, 0.486, 0.651),
    });

    page.drawText("ECOMZONE", {
      x: leftMargin + 20,
      y: y - 30,
      size: 32,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 70;

    // Invoice Details Section (Left) and Bill To (Right)
    page.drawText("INVOICE", {
      x: leftMargin,
      y,
      size: 14,
      font: boldFont,
    });

    page.drawText("BILL TO", {
      x: rightMargin - 100,
      y,
      size: 14,
      font: boldFont,
    });

    y -= 25;

    // Invoice Details
    page.drawText(`Invoice No: ${order.orderId}`, {
      x: leftMargin,
      y,
      size: 10,
      font: regularFont,
    });

    page.drawText(`Name: ${(order as any).customerName || "N/A"}`, {
      x: rightMargin - 200,
      y,
      size: 10,
      font: regularFont,
    });

    y -= 15;

    const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN");
    page.drawText(`Date: ${invoiceDate}`, {
      x: leftMargin,
      y,
      size: 10,
      font: regularFont,
    });

    page.drawText(`Email: ${(order as any).customerEmail || "N/A"}`, {
      x: rightMargin - 200,
      y,
      size: 10,
      font: regularFont,
    });

    y -= 15;

    if (order.shippingAddress) {
      const addr = order.shippingAddress as any;
      const addressText = `${addr.address || ""}, ${addr.city || ""}, ${
        addr.state || ""
      } ${addr.postalCode || ""}`.trim();
      page.drawText(addressText.substring(0, 50), {
        x: rightMargin - 200,
        y,
        size: 10,
        font: regularFont,
      });
    }

    y -= 35;

    // Table Headers
    page.drawRectangle({
      x: leftMargin,
      y: y - 18,
      width: contentWidth,
      height: 18,
      color: rgb(0.016, 0.486, 0.651),
    });

    page.drawText("Description", {
      x: leftMargin + 5,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText("Qty", {
      x: leftMargin + 310,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText("Rate", {
      x: leftMargin + 360,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText("Amount", {
      x: leftMargin + 430,
      y: y - 13,
      size: 10,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 20;

    // Items rows
    order.items.forEach((item, index) => {
      const unitPrice = item.price / item.quantity;
      const itemTotal = item.price;

      // Alternate row background
      if (index % 2 === 0) {
        page.drawRectangle({
          x: leftMargin,
          y: y - 18,
          width: contentWidth,
          height: 18,
          color: rgb(0.95, 0.95, 0.95),
        });
      }

      page.drawText(item.product.name.substring(0, 35), {
        x: leftMargin + 5,
        y: y - 13,
        size: 9,
        font: regularFont,
      });

      page.drawText(item.quantity.toString(), {
        x: leftMargin + 310,
        y: y - 13,
        size: 9,
        font: regularFont,
      });

      page.drawText(`Rs ${unitPrice.toFixed(2)}`, {
        x: leftMargin + 360,
        y: y - 13,
        size: 9,
        font: regularFont,
      });

      page.drawText(`Rs ${itemTotal.toFixed(2)}`, {
        x: leftMargin + 430,
        y: y - 13,
        size: 9,
        font: regularFont,
      });

      y -= 20;
    });

    y -= 20;

    // Totals Section
    page.drawLine({
      start: { x: leftMargin, y },
      end: { x: rightMargin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    page.drawText(`Subtotal: Rs ${order.subtotal?.toFixed(2) || "0.00"}`, {
      x: leftMargin + 350,
      y,
      size: 10,
      font: regularFont,
    });

    y -= 18;

    page.drawText(`GST (5%): Rs ${order.gstAmount?.toFixed(2) || "0.00"}`, {
      x: leftMargin + 350,
      y,
      size: 10,
      font: regularFont,
    });

    y -= 18;

    // Grand Total Box
    page.drawRectangle({
      x: leftMargin + 340,
      y: y - 25,
      width: 222,
      height: 25,
      color: rgb(0.016, 0.486, 0.651),
    });

    page.drawText(
      `Total: Rs ${order.totalAmount?.toFixed(2) || "0.00"}`,
      {
        x: leftMargin + 350,
        y: y - 17,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1),
      }
    );

    y -= 60;

    // Footer
    page.drawText("Thank you for your business!", {
      x: leftMargin,
      y,
      size: 11,
      font: regularFont,
    });

    y -= 20;

    page.drawText("Website: www.ecomzone.in | Email: ecomzone.sales@gmail.com", {
      x: leftMargin,
      y,
      size: 9,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    const safeBytes = Uint8Array.from(pdfBytes);

    return res
      .header("Content-Type", "application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename=invoice-${orderId}.pdf`
      )
      .send(Buffer.from(safeBytes));
  } catch (error: any) {
    console.error("INVOICE ERROR:", error);
    return res
      .status(500)
      .json({ error: error.message || "Invoice failed" });
  }
});

export default router;
