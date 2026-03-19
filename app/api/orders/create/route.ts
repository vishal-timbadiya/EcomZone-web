import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  try {
    // Validate authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: { 
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
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { cartItems, paymentMode, shippingAddress, billingAddress, useGstBilling, gstDetails, shippingCharge = 0, totalWeight = 0 } = body;

    // Validate cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (!item.productId || typeof item.productId !== "string") {
        return NextResponse.json(
          { error: "Invalid cart data: missing product ID" },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      // Validate stock
      const singleQty = Number(item.singleQty || 0);
      const cartonQty = Number(item.cartonQty || 0);
      const totalQty = singleQty + cartonQty * (item.cartonQtyPerBox || product.cartonQty);

      if (product.stock < totalQty) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        );
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
      return NextResponse.json(
        { error: `Minimum order value is Rs ${MIN_ORDER_VALUE}` },
        { status: 400 }
      );
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
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 750;

    // Header
    page.drawText("ECOMZONE INVOICE", {
      x: 50,
      y,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });

    y -= 40;

    // Order details
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

    // Items
    order.items.forEach((item, index) => {
      page.drawText(
        `${index + 1}. ${item.product.name} | Qty: ${item.quantity} | Rs ${item.price.toFixed(2)}`,
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

    // Totals
    page.drawText(`Subtotal: Rs ${order.subtotal.toFixed(2)}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    if (order.gstAmount > 0) {
      y -= 20;
      page.drawText(`GST: Rs ${order.gstAmount.toFixed(2)}`, {
        x: 50,
        y,
        size: 12,
        font,
      });
    }

    if (order.shippingCharge > 0) {
      y -= 20;
      page.drawText(`Shipping: Rs ${order.shippingCharge.toFixed(2)}`, {
        x: 50,
        y,
        size: 12,
        font,
      });
    }

    y -= 20;
    page.drawText(`Total: Rs ${order.totalAmount.toFixed(2)}`, {
      x: 50,
      y,
      size: 14,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    // Send confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (
        user &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS
      ) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
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
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
    });
  } catch (error: unknown) {
    console.error("ORDER ERROR:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Server error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

