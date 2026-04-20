import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const { orderIds, startSerial } = req.body;
  
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "No orders specified" });
      }
  
      // Get current download date
      const now = new Date();
      const downloadDate = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const downloadTime = now.toLocaleTimeString();
  
      // Use provided startSerial or default to 1
      const serialStart = startSerial ? parseInt(startSerial) : 1;
  
      // Use raw SQL to fetch orders
      const ordersResult = await prisma.$queryRawUnsafe<any[]>(
        `SELECT o.*, u.name as user_name, u.email as user_email, u.mobile as user_mobile
         FROM "Order" o
         JOIN "User" u ON o."userId" = u.id
         WHERE o."orderId" IN (${orderIds.map((_: any, i: number) => `$${i + 1}`).join(", ")})
         ORDER BY o."createdAt" ASC`,
        ...orderIds
      );
  
      if (ordersResult.length === 0) {
        return res.status(404).json({ message: "No orders found" });
      }
  
      // Fetch items for each order using raw SQL
      const orders = await Promise.all(
        ordersResult.map(async (order: any, index: number) => {
          const itemsResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT oi.*, p.name as product_name, p."productCode" as product_code
             FROM "OrderItem" oi
             JOIN "Product" p ON oi."productId" = p.id
             WHERE oi."orderId" = $1`,
            order.id
          );
  
          // Calculate totals for this order
          const subtotal = itemsResult.reduce((sum: number, item: any) => sum + (Number(item.quantity) * parseFloat(item.price.toString())), 0);
          const gstAmount = parseFloat(order.gstAmount?.toString() || "0");
          const totalAmount = parseFloat(order.totalAmount?.toString() || "0");
  
          return {
            ...order,
            serialNumber: serialStart + index,
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
                productCode: item.product_code,
              },
            })),
            subtotal,
            gstAmount,
            totalAmount,
          };
        })
      );
  
      // Create PDF
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
      // ========== PAGE 1: ITEM SUMMARY (All aggregated items) ==========
      const summaryPage = pdfDoc.addPage([595.28, 841.89]);
      let y = summaryPage.getSize().height - 50;
      const pageWidth = summaryPage.getSize().width;
  
      summaryPage.drawText("CONSOLIDATED ITEM LIST", {
        x: 50,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
  
      y -= 30;
      summaryPage.drawText(`Date: ${downloadDate} | Time: ${downloadTime}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
  
      y -= 25;
      summaryPage.drawText("Total Orders:", {
        x: 50,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      summaryPage.drawText(String(orders.length), {
        x: 150,
        y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
  
      y -= 35;
  
      // Aggregate items by product code
      const aggregatedItems: { [key: string]: { productCode: string; productName: string; totalQty: number } } = {};
      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const key = item.product?.productCode || item.product?.name || "Unknown";
          if (aggregatedItems[key]) {
            aggregatedItems[key].totalQty += item.quantity;
          } else {
            aggregatedItems[key] = {
              productCode: item.product?.productCode || "-",
              productName: item.product?.name || "Unknown Product",
              totalQty: item.quantity,
            };
          }
        });
      });
  
      const aggregatedList = Object.values(aggregatedItems);
  
      // Table header
      summaryPage.drawText("S.No.", { x: 50, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
      summaryPage.drawText("Product Code", { x: 100, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
      summaryPage.drawText("Item Name", { x: 220, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
      summaryPage.drawText("Total Qty", { x: 480, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
  
      y -= 5;
      summaryPage.drawLine({
        start: { x: 50, y },
        end: { x: pageWidth - 50, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
  
      y -= 18;
  
      // Aggregate item rows
      let grandTotalQty = 0;
      aggregatedList.forEach((item: any, index: number) => {
        if (y < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = newPage.getSize().height - 50;
        }
        
        summaryPage.drawText(String(index + 1), { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
        summaryPage.drawText(item.productCode || "-", { x: 100, y, size: 10, font, color: rgb(0, 0, 0) });
        summaryPage.drawText(item.productName.substring(0, 35), { x: 220, y, size: 10, font, color: rgb(0, 0, 0) });
        summaryPage.drawText(String(item.totalQty), { x: 480, y, size: 10, font, color: rgb(0, 0, 0) });
        
        grandTotalQty += item.totalQty;
        y -= 18;
      });
  
      y -= 10;
      summaryPage.drawLine({
        start: { x: 50, y },
        end: { x: pageWidth - 50, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
  
      y -= 18;
      summaryPage.drawText(`TOTAL QUANTITY: ${grandTotalQty}`, {
        x: 300,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
  
      // ========== PAGE 2: ORDER WISE LIST (Blank for warehouse) ==========
      const orderListPage = pdfDoc.addPage([595.28, 841.89]);
      y = orderListPage.getSize().height - 50;
  
      orderListPage.drawText("ORDER WISE PACKING LIST", {
        x: 50,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
  
      y -= 30;
      orderListPage.drawText(`Date: ${downloadDate} | Time: ${downloadTime}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
  
      y -= 35;
  
      // Table header - with blank columns for warehouse
      orderListPage.drawText("S.No.", { x: 30, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      orderListPage.drawText("Order No.", { x: 70, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      //orderListPage.drawText("Customer Name", { x: 170, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      //orderListPage.drawText("Mobile", { x: 310, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      orderListPage.drawText("Qty", { x: 240, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      orderListPage.drawText("Amount", { x: 310, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      orderListPage.drawText("GST", { x: 400, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
      orderListPage.drawText("Total", { x: 480, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
  
      y -= 5;
      orderListPage.drawLine({
        start: { x: 30, y },
        end: { x: pageWidth - 30, y },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
  
      y -= 15;
  
      // Order rows with blank amount fields for manual entry
      orders.forEach((order: any) => {
        if (y < 50) {
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          y = newPage.getSize().height - 50;
        }
  
        const totalQty = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        
        orderListPage.drawText(String(order.serialNumber), { x: 30, y, size: 9, font, color: rgb(0, 0, 0) });
        orderListPage.drawText(order.orderId?.slice(0, 20).toUpperCase() || "-", { x: 70, y, size: 9, font, color: rgb(0, 0, 0) });
        //orderListPage.drawText(order.user.name?.substring(0, 18) || "-", { x: 170, y, size: 9, font, color: rgb(0, 0, 0) });
        //orderListPage.drawText(order.user.mobile || "-", { x: 310, y, size: 9, font, color: rgb(0, 0, 0) });
        orderListPage.drawText(String(totalQty), { x: 240, y, size: 9, font, color: rgb(0, 0, 0) });
        // Blank columns for warehouse to fill
        orderListPage.drawText("____", { x: 310, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
        orderListPage.drawText("____", { x: 400, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
        orderListPage.drawText("____", { x: 480, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  
        y -= 15;
      });
  
      // ========== INDIVIDUAL ORDER PAGES ==========
      for (const order of orders) {
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        y = height - 50;
  
        // Header with serial number
        page.drawText(`PACKING LIST : ${order.serialNumber}`, {
          x: 50,
          y,
          size: 20,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
  
        y -= 35;
  
        // Order Number
        page.drawText(`Order Number: ${order.orderId}`, {
          x: 50,
          y,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
  
        y -= 18;
  
        // Date and Time
        page.drawText(`Date: ${downloadDate}`, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
  
        y -= 15;
        page.drawText(`Time: ${downloadTime}`, {
          x: 50,
          y,
          size: 10,
          font,
          color: rgb(0, 0, 0),
        });
  
        y -= 25;
  
        // Customer Info
        page.drawText("Name:", {
          x: 50,
          y,
          size: 11,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(order.user.name || "-", {
          x: 100,
          y,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        });
  
        y -= 18;
        // page.drawText("Mobile:", {
        //   x: 50,
        //   y,
        //   size: 11,
        //   font: boldFont,
        //   color: rgb(0, 0, 0),
        // });
        // page.drawText(order.user.mobile || "-", {
        //   x: 110,
        //   y,
        //   size: 11,
        //   font,
        //   color: rgb(0, 0, 0),
        // });
  
        y -= 30;
  
        // Items Header
        page.drawText("S.No.", { x: 50, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
        page.drawText("Item Code", { x: 100, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
        page.drawText("Item Name", { x: 200, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
        page.drawText("Qty", { x: 420, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
  
        y -= 5;
        page.drawLine({
          start: { x: 50, y },
          end: { x: width - 50, y },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });
  
        y -= 18;
  
        // Items
        const totalQty = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        order.items.forEach((item: any, index: number) => {
          page.drawText(String(index + 1), { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(item.product?.productCode || "-", { x: 100, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText((item.product?.name || "Product").substring(0, 30), { x: 200, y, size: 10, font, color: rgb(0, 0, 0) });
          page.drawText(String(item.quantity), { x: 420, y, size: 10, font, color: rgb(0, 0, 0) });
          y -= 18;
        });
  
        // Total
        y -= 10;
        page.drawLine({
          start: { x: 50, y },
          end: { x: width - 50, y },
          thickness: 1,
          color: rgb(0.7, 0.7, 0.7),
        });
  
        y -= 18;
        page.drawText(`Total: ${totalQty}`, {
          x: 350,
          y,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      }
  
      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
  
      // Generate filename with serial number range
      const firstSerial = orders[0].serialNumber;
      const lastSerial = orders[orders.length - 1].serialNumber;
      const filename =
        orders.length > 1
          ? `${firstSerial}-${lastSerial} Pkg list ${downloadDate}.pdf`
          : `${firstSerial} Pkg list ${downloadDate}.pdf`;
  
      return res.json({
        success: true,
        pdf: pdfBase64,
        filename: filename,
        serialRange: {
          start: firstSerial,
          end: lastSerial,
        },
        totalQuantity: grandTotalQty,
      });
    } catch (error: any) {
      console.error("Simple PDF Error:", error);
      return res.status(error.status || 500).json({ message: "Error generating PDF", error: error.message });
    }
  });

export default router;
