import { prisma } from '@/lib/prisma';
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Router, Request, Response } from 'express';

const router = Router();

const MIN_ORDER_VALUE = 2500;

interface CartItem {
  productId: string;
  singleQty: number;
  cartonQty: number;
  cartonQtyPerBox?: number;
}

interface JwtPayload {
  userId: string;
  role?: string;
}

router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate authorization header
    const authHeader = req.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired token",
      });
    }

    // Parse request body
    const body = req.body as {
      cartItems: CartItem[];
      paymentMode?: string;
      shippingAddress?: {
        name: string;
        mobile: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
      };
      billingAddress?: {
        name: string;
        mobile: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
      };
      useGstBilling?: boolean;
      gstDetails?: {
        gstNumber: string;
        companyName: string;
        businessEmail: string;
      };
      shippingCharge?: number;
      totalWeight?: number;
    };

    const { cartItems, paymentMode, shippingAddress, billingAddress, useGstBilling, gstDetails, shippingCharge = 0, totalWeight = 0 } = body;

    // Validate cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        error: "Cart is empty",
      });
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (!item.productId || typeof item.productId !== "string") {
        return res.status(400).json({
          error: "Invalid cart data: missing product ID",
        });
      }
    }

    // Calculate order totals and validate stock
    let subtotal = 0;
    let gstAmount = 0;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      price: number;
      productName: string;
    }> = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({
          error: `Product not found: ${item.productId}`,
        });
      }

      // Validate stock
      const singleQty = Number(item.singleQty || 0);
      const cartonQty = Number(item.cartonQty || 0);
      const totalQty = singleQty + cartonQty * (item.cartonQtyPerBox || product.cartonQty);

      if (product.stock < totalQty) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        });
      }

      // Calculate item totals
      const itemSubtotal = singleQty * product.singlePrice + cartonQty * product.cartonPrice;
      const itemGST = (itemSubtotal * product.gstPercentage) / 100;

      subtotal += itemSubtotal;
      gstAmount += itemGST;

      orderItems.push({
        productId: item.productId,
        quantity: totalQty,
        price: itemSubtotal,
        productName: product.name,
      });
    }

    // Calculate total - only include GST if customer selected GST billing
    const finalGstAmount = useGstBilling ? gstAmount : 0;
    const finalShippingCharge = shippingCharge || 0;
    const totalAmount = subtotal + finalGstAmount + finalShippingCharge;

    // Validate minimum order value
    if (totalAmount < MIN_ORDER_VALUE) {
      return res.status(400).json({
        error: `Minimum order value is Rs ${MIN_ORDER_VALUE}`,
      });
    }

    const orderId = "EZ" + Date.now();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderId,
          user: {
            connect: { id: decoded.userId },
          },
          subtotal,
          gstAmount: finalGstAmount,
          shippingCharge: finalShippingCharge,
          totalWeight: totalWeight || 0,
          totalAmount,
          paymentMode: (paymentMode || "COD") as "COD" | "UPI" | "PHONEPE",
          paymentStatus: "PENDING",
          orderStatus: "CONFIRMED",
          // Address and GST as JSON
          shippingAddress: shippingAddress || undefined,
          billingAddress: billingAddress || undefined,
          gstDetails: (useGstBilling && gstDetails) ? gstDetails : undefined,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Update product stock
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const singleQty = Number(item.singleQty || 0);
          const cartonQty = Number(item.cartonQty || 0);
          const totalQty = singleQty + cartonQty * (item.cartonQtyPerBox || product.cartonQty);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: product.stock - totalQty,
            },
          });
        }
      }

      return newOrder;
    });

    // Generate PDF invoice
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Standard letter size
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 760;
    const leftMargin = 50;
    const rightMargin = 562;
    const contentWidth = rightMargin - leftMargin;

    // HEADER SECTION
    page.drawText("ECOMZONE", {
      x: leftMargin,
      y,
      size: 32,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.8),
    });

    page.drawText("INVOICE", {
      x: rightMargin - 100,
      y,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.8),
    });

    y -= 40;

    // Horizontal line
    page.drawLine({
      start: { x: leftMargin, y },
      end: { x: rightMargin, y },
      thickness: 2,
      color: rgb(0.1, 0.4, 0.8),
    });

    y -= 25;

    // Invoice details - Two columns
    // Left column
    page.drawText("Invoice Details", {
      x: leftMargin,
      y,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    y -= 15;
    page.drawText(`Invoice No: ${order.orderId}`, { x: leftMargin, y, size: 10, font: regularFont });
    y -= 12;
    page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`, { x: leftMargin, y, size: 10, font: regularFont });
    y -= 12;
    page.drawText(`Payment Mode: ${order.paymentMode}`, { x: leftMargin, y, size: 10, font: regularFont });

    // Right column - Bill To
    const rightColX = leftMargin + 300;
    let billY = y + 39;

    page.drawText("Bill To", {
      x: rightColX,
      y: billY,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    billY -= 15;

    const shippingAddr = (body.shippingAddress || {}) as any;
    const billLines = [
      shippingAddr.name || "Customer",
      shippingAddr.address || "",
      `${shippingAddr.city || ""}, ${shippingAddr.state || ""} ${shippingAddr.pincode || ""}`,
      `Phone: ${shippingAddr.mobile || ""}`,
      `Email: ${shippingAddr.email || ""}`,
    ].filter((line: string) => line.trim());

    billLines.forEach((line: string) => {
      page.drawText(line, {
        x: rightColX,
        y: billY,
        size: 9,
        font: regularFont,
      });
      billY -= 10;
    });

    y -= 70;

    // Items Table
    y -= 10;

    // Table header background
    page.drawRectangle({
      x: leftMargin,
      y: y - 20,
      width: contentWidth,
      height: 22,
      color: rgb(0.1, 0.4, 0.8),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Table header text
    page.drawText("Item Description", {
      x: leftMargin + 5,
      y: y - 15,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    page.drawText("Qty", {
      x: leftMargin + 300,
      y: y - 15,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    page.drawText("Rate", {
      x: leftMargin + 350,
      y: y - 15,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    page.drawText("Amount", {
      x: leftMargin + 420,
      y: y - 15,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 25;

    // Items rows
    order.items.forEach((item, index) => {
      const unitPrice = item.price / item.quantity; // Calculate unit price
      const itemTotal = item.price; // This is already the item subtotal

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

    // Totals section
    y -= 15;

    // Total summary box
    const summaryX = leftMargin + 350;

    page.drawText("Subtotal:", {
      x: summaryX,
      y,
      size: 9,
      font: regularFont,
    });
    page.drawText(`Rs ${order.subtotal.toFixed(2)}`, {
      x: summaryX + 100,
      y,
      size: 9,
      font: regularFont,
    });

    y -= 15;

    if (order.gstAmount > 0) {
      page.drawText("GST Amount:", {
        x: summaryX,
        y,
        size: 9,
        font: regularFont,
      });
      page.drawText(`Rs ${order.gstAmount.toFixed(2)}`, {
        x: summaryX + 100,
        y,
        size: 9,
        font: regularFont,
      });

      y -= 15;
    }

    if (order.shippingCharge > 0) {
      page.drawText("Shipping Charge:", {
        x: summaryX,
        y,
        size: 9,
        font: regularFont,
      });
      page.drawText(`Rs ${order.shippingCharge.toFixed(2)}`, {
        x: summaryX + 100,
        y,
        size: 9,
        font: regularFont,
      });

      y -= 15;
    }

    // Grand total box
    page.drawRectangle({
      x: summaryX - 10,
      y: y - 22,
      width: 160,
      height: 25,
      color: rgb(0.1, 0.4, 0.8),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    page.drawText("TOTAL DUE:", {
      x: summaryX,
      y: y - 16,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    page.drawText(`Rs ${order.totalAmount.toFixed(2)}`, {
      x: summaryX + 100,
      y: y - 16,
      size: 11,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 50;

    // Footer
    page.drawLine({
      start: { x: leftMargin, y },
      end: { x: rightMargin, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    y -= 15;

    page.drawText("Thank you for your business!", {
      x: leftMargin,
      y,
      size: 9,
      font: boldFont,
      color: rgb(0.1, 0.4, 0.8),
    });

    y -= 12;

    page.drawText("Website: www.ecomzone.in | Email: ecomzone.sales@gmail.com", {
      x: leftMargin,
      y,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      console.log('Sending email to:', user?.email);
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

      if (user && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        console.log('Transporter created, sending email...');
        
        const mailResult = await transporter.sendMail({
          from: `"EcomZone" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Order Confirmation - ${order.orderId}`,
          html: `
            <h2>Thank you for your order!</h2>
            <p>Your Order ID: <b>${order.orderId}</b></p>
            <p>Total: Rs ${order.totalAmount.toFixed(2)}</p>
            <p>Payment Mode: ${order.paymentMode}</p>
            <p>We'll notify you once your order is dispatched.</p>
          `,
          attachments: [
            {
              filename: `invoice-${order.orderId}.pdf`,
              content: Buffer.from(pdfBytes),
            },
          ],
        });

        console.log('Email sent successfully:', mailResult.response);
      } else {
        console.log('Email not sent - missing user or credentials');
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the order if email fails
    }

    return res.json({
      success: true,
      orderId: order.orderId,
    });
  } catch (error: unknown) {
    console.error("ORDER ERROR:", error);

    const errorMessage = error instanceof Error ? error.message : "Server error";

    return res.status(500).json({
      error: errorMessage,
    });
  }
});

export default router;
