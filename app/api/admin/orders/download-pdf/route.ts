import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { message: "No orders specified" },
        { status: 400 }
      );
    }

    // Use raw SQL to fetch orders to avoid Prisma caching issues
    const ordersResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
       FROM "Order" o
       JOIN "User" u ON o."userId" = u.id
       WHERE o."orderId" IN (${orderIds.map((_: any, i: number) => `$${i + 1}`).join(", ")})
       ORDER BY o."createdAt" DESC`,
      ...orderIds
    );

    if (ordersResult.length === 0) {
      return NextResponse.json(
        { message: "No orders found" },
        { status: 404 }
      );
    }

    // Fetch items for each order using raw SQL
    const orders = await Promise.all(
      ordersResult.map(async (order: any) => {
        const itemsResult = await prisma.$queryRawUnsafe<any[]>(
          `SELECT oi.*, p.name as product_name
           FROM "OrderItem" oi
           JOIN "Product" p ON oi."productId" = p.id
           WHERE oi."orderId" = $1`,
          order.id
        );

        return {
          ...order,
          user: {
            name: order.user_name,
            email: order.user_email,
            mobile: order.user_mobile,
          },
          items: itemsResult.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            product: {
              name: item.product_name,
            },
          })),
        };
      })
    );

    // Create PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const order of orders) {
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();
      let y = height - 50;

      // Header
      page.drawText("INVOICE", {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 30;

      // Order Details
      page.drawText(`Order Number: ${order.orderId}`, {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 20;
      page.drawText(`Date: ${new Date(order.createdAt).toLocaleString()}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 30;

      // Customer Details
      page.drawText("Customer Details:", {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 18;
      page.drawText(`Name: ${order.user.name}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 15;
      page.drawText(`Email: ${order.user.email}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 15;
      page.drawText(`Mobile: ${order.user.mobile}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 30;

      // Items Header
      page.drawText("S.No.", {
        x: 50,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText("Item Name", {
        x: 100,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText("Qty", {
        x: 320,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText("Price", {
        x: 370,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText("Total", {
        x: 450,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 5;
      page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= 18;

      // Items
      order.items.forEach((item: any, index: number) => {
        page.drawText(String(index + 1), {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        page.drawText(item.product?.name || "Product", {
          x: 100,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        page.drawText(String(item.quantity), {
          x: 320,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        // Using Rs. instead of Rupee symbol
        page.drawText(`Rs.${item.price}`, {
          x: 370,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        page.drawText(`Rs.${item.price * item.quantity}`, {
          x: 450,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
        y -= 18;
      });

      y -= 20;

      // Totals
      page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= 20;
      page.drawText(`Subtotal: Rs.${order.subtotal}`, {
        x: 350,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 15;
      page.drawText(`GST: Rs.${order.gstAmount}`, {
        x: 350,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 20;
      page.drawText(`Total Amount: Rs.${order.totalAmount}`, {
        x: 350,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      y -= 30;

      // Payment Info
      page.drawText(`Payment Mode: ${order.paymentMode}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 15;
      page.drawText(`Payment Status: ${order.paymentStatus}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      y -= 15;
      page.drawText(`Order Status: ${order.orderStatus}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      if (order.courierName && order.trackingId) {
        y -= 15;
        page.drawText(`Courier: ${order.courierName} - ${order.trackingId}`, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `invoice-${orderIds.join("-")}.pdf`,
    });
  } catch (error: any) {
    console.error("PDF Download Error:", error);
    return NextResponse.json(
      { message: "Error generating PDF", error: error.message },
      { status: 500 }
    );
  }
}
