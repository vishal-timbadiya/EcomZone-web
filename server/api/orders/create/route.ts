import { randomBytes } from 'crypto';
import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware';
import { calculateShippingCharge, calculateTotalWeightKg } from '../../../lib/shipping';
import { generateInvoicePdf } from '../../../lib/invoice';
import { sendMail } from '../../../lib/mailer';
import { logger } from '../../../lib/logger';

const router = Router();

const MIN_ORDER_VALUE = 2500;
const MAX_CART_ITEMS = 100;
const MAX_QTY_PER_ITEM = 100000;

interface CartItem {
  productId: string;
  singleQty: number;
  cartonQty: number;
  cartonQtyPerBox?: number;
}

interface Address {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

/**
 * Collision-resistant order id. "EZ" + Date.now() alone produced duplicates when
 * two checkouts landed in the same millisecond, which failed the unique
 * constraint and surfaced as a 500.
 */
function generateOrderId(): string {
  return `EZ${Date.now()}${randomBytes(3).toString('hex').toUpperCase()}`;
}

function toNonNegativeInt(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

router.post('/', async (req: Request, res: Response) => {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userId = auth.user.userId;

  try {
    const body = req.body as {
      cartItems?: CartItem[];
      paymentMode?: string;
      shippingAddress?: Address;
      billingAddress?: Address;
      useGstBilling?: boolean;
      gstDetails?: { gstNumber?: string; companyName?: string; businessEmail?: string };
    };

    const { cartItems, paymentMode, shippingAddress, billingAddress, useGstBilling, gstDetails } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (cartItems.length > MAX_CART_ITEMS) {
      return res.status(400).json({ error: 'Too many items in cart' });
    }

    // Only payment modes the storefront actually offers. PHONEPE is deliberately
    // absent - the gateway has been removed.
    const allowedPaymentModes = ['COD', 'UPI', 'RAZORPAY'] as const;
    type AllowedPaymentMode = (typeof allowedPaymentModes)[number];

    const resolvedPaymentMode: AllowedPaymentMode = allowedPaymentModes.includes(
      paymentMode as AllowedPaymentMode
    )
      ? (paymentMode as AllowedPaymentMode)
      : 'COD';

    // Shipping address is required to compute delivery cost and to ship at all.
    if (
      !shippingAddress?.name ||
      !shippingAddress?.mobile ||
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.pincode
    ) {
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }

    if (!/^[0-9]{10}$/.test(String(shippingAddress.mobile))) {
      return res.status(400).json({ error: 'Mobile must be 10 digits' });
    }

    if (!/^[0-9]{6}$/.test(String(shippingAddress.pincode))) {
      return res.status(400).json({ error: 'Pincode must be 6 digits' });
    }

    if (useGstBilling) {
      if (!gstDetails?.gstNumber || String(gstDetails.gstNumber).length !== 15 || !gstDetails?.companyName) {
        return res.status(400).json({ error: 'GST number and company name are required for GST billing' });
      }
    }

    // Normalise and de-duplicate the requested lines up front.
    const requestedById = new Map<string, { singleQty: number; cartonQty: number; cartonQtyPerBox?: number }>();

    for (const item of cartItems) {
      if (!item?.productId || typeof item.productId !== 'string') {
        return res.status(400).json({ error: 'Invalid cart data: missing product ID' });
      }

      const singleQty = toNonNegativeInt(item.singleQty);
      const cartonQty = toNonNegativeInt(item.cartonQty);

      if (singleQty === 0 && cartonQty === 0) continue;

      if (singleQty > MAX_QTY_PER_ITEM || cartonQty > MAX_QTY_PER_ITEM) {
        return res.status(400).json({ error: 'Requested quantity is too large' });
      }

      const existing = requestedById.get(item.productId);

      requestedById.set(item.productId, {
        singleQty: (existing?.singleQty || 0) + singleQty,
        cartonQty: (existing?.cartonQty || 0) + cartonQty,
        cartonQtyPerBox: item.cartonQtyPerBox,
      });
    }

    if (requestedById.size === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Single query for every product rather than one per line.
    const products = await prisma.product.findMany({
      where: { id: { in: [...requestedById.keys()] }, isActive: true },
    });

    if (products.length !== requestedById.size) {
      const found = new Set(products.map((product) => product.id));
      const missing = [...requestedById.keys()].filter((id) => !found.has(id));
      return res.status(404).json({ error: `Product not available: ${missing[0]}` });
    }

    let subtotal = 0;
    let gstAmount = 0;

    const orderLines: Array<{ productId: string; quantity: number; price: number; name: string }> = [];
    const weighedItems: Array<{ weightGrams: number; units: number }> = [];

    for (const product of products) {
      const requested = requestedById.get(product.id)!;
      const perBox = toNonNegativeInt(requested.cartonQtyPerBox) || product.cartonQty || 1;
      const totalQty = requested.singleQty + requested.cartonQty * perBox;

      if (totalQty <= 0) continue;

      // Prices always come from the database, never from the request.
      const itemSubtotal =
        requested.singleQty * product.singlePrice + requested.cartonQty * product.cartonPrice;

      subtotal += itemSubtotal;
      gstAmount += (itemSubtotal * product.gstPercentage) / 100;

      orderLines.push({
        productId: product.id,
        quantity: totalQty,
        price: itemSubtotal,
        name: product.name,
      });

      weighedItems.push({ weightGrams: product.weight || 0, units: totalQty });
    }

    if (orderLines.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Weight and shipping are derived server-side. They used to be accepted from
    // the request body, which let a client zero out or negate the delivery cost.
    const totalWeight = calculateTotalWeightKg(weighedItems);
    const shippingCharge = await calculateShippingCharge({
      totalWeightKg: totalWeight,
      state: shippingAddress.state,
      city: shippingAddress.city,
    });

    const finalGstAmount = useGstBilling ? gstAmount : 0;
    const totalAmount = subtotal + finalGstAmount + shippingCharge;

    if (totalAmount < MIN_ORDER_VALUE) {
      return res.status(400).json({ error: `Minimum order value is Rs ${MIN_ORDER_VALUE}` });
    }

    const orderId = generateOrderId();

    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock conditionally. The guard on `stock: { gte: quantity }`
      // makes the check and the write a single atomic operation, so two
      // concurrent checkouts cannot both claim the last unit. Previously stock
      // was validated before the transaction and then written with a
      // read-modify-write, which oversold under concurrency.
      for (const line of orderLines) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });

        if (updated.count === 0) {
          const current = await tx.product.findUnique({
            where: { id: line.productId },
            select: { name: true, stock: true },
          });

          const error = new Error(
            `Insufficient stock for "${current?.name || line.name}". Available: ${current?.stock ?? 0}`
          ) as Error & { status: number };
          error.status = 409;
          throw error;
        }
      }

      return tx.order.create({
        data: {
          orderId,
          user: { connect: { id: userId } },
          subtotal,
          gstAmount: finalGstAmount,
          shippingCharge,
          totalWeight,
          totalAmount,
          paymentMode: resolvedPaymentMode,
          paymentStatus: 'PENDING',
          orderStatus: 'CONFIRMED',
          shippingAddress: shippingAddress as object,
          billingAddress: (billingAddress || shippingAddress) as object,
          gstDetails: useGstBilling && gstDetails ? (gstDetails as object) : undefined,
          items: {
            create: orderLines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              price: line.price,
            })),
          },
        },
        include: { items: true },
      });
    });

    logger.info({
      event: 'order_created',
      orderId: order.orderId,
      userId,
      totalAmount,
      paymentMode: resolvedPaymentMode,
    });

    // Respond as soon as the order is committed. Invoice rendering and email
    // delivery used to run inline, adding PDF generation plus an SMTP round trip
    // to every checkout request.
    res.json({
      success: true,
      orderId: order.orderId,
      totalAmount,
      paymentMode: resolvedPaymentMode,
      requiresPayment: resolvedPaymentMode !== 'COD',
    });

    void sendOrderConfirmation({
      orderId: order.orderId,
      createdAt: order.createdAt,
      paymentMode: resolvedPaymentMode,
      subtotal,
      gstAmount: finalGstAmount,
      shippingCharge,
      totalAmount,
      items: orderLines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      shippingAddress,
      userId,
    });

    return;
  } catch (error: any) {
    logger.error({ event: 'order_create_failed', message: error?.message, userId });

    const status = error?.status || 500;

    return res.status(status).json({
      error: status === 500 ? 'Could not place order. Please try again.' : error.message,
    });
  }
});

/**
 * Render the invoice and email it. Failures are logged and swallowed - the order
 * is already committed and must not be reported as failed.
 */
async function sendOrderConfirmation(params: {
  orderId: string;
  createdAt: Date;
  paymentMode: string;
  subtotal: number;
  gstAmount: number;
  shippingCharge: number;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress: Address;
  userId: string;
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    });

    if (!user?.email) return;

    const pdfBytes = await generateInvoicePdf(
      {
        orderId: params.orderId,
        createdAt: params.createdAt,
        paymentMode: params.paymentMode,
        subtotal: params.subtotal,
        gstAmount: params.gstAmount,
        shippingCharge: params.shippingCharge,
        totalAmount: params.totalAmount,
        items: params.items,
      },
      params.shippingAddress
    );

    await sendMail({
      to: user.email,
      subject: `Order Confirmation - ${params.orderId}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Your Order ID: <b>${params.orderId}</b></p>
        <p>Total: Rs ${params.totalAmount.toFixed(2)}</p>
        <p>Payment Mode: ${params.paymentMode}</p>
        <p>We'll notify you once your order is dispatched.</p>
      `,
      attachments: [
        { filename: `invoice-${params.orderId}.pdf`, content: Buffer.from(pdfBytes) },
      ],
    });
  } catch (error) {
    logger.error({
      event: 'order_confirmation_failed',
      orderId: params.orderId,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

export default router;
