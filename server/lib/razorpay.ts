import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Razorpay client and signature verification helpers.
 *
 * Every inbound payment confirmation - both the browser callback and the
 * server-to-server webhook - is verified with an HMAC before it is allowed to
 * change an order's payment status. The gateway this replaced accepted
 * unauthenticated webhooks, which let anyone mark any order as paid.
 */

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

let cachedClient: Razorpay | null = null;

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay is not configured') as Error & { status: number };
    error.status = 503;
    throw error;
  }

  return {
    keyId,
    keySecret,
    // Falls back to the API secret, which is Razorpay's own default when no
    // separate webhook secret is configured in the dashboard.
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || keySecret,
  };
}

export function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;

  const { keyId, keySecret } = getRazorpayConfig();

  cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return cachedClient;
}

/** Compare two hex digests without leaking timing information. */
function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  if (bufferA.length !== bufferB.length) return false;

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Verify the signature Razorpay Checkout hands back to the browser after a
 * successful payment. The signature is HMAC-SHA256 of "<order_id>|<payment_id>"
 * keyed with the API secret.
 */
export function verifyCheckoutSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const { razorpayOrderId, razorpayPaymentId, signature } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  // Unconfigured means nothing can be verified, so nothing is accepted. This
  // must return false rather than throw - callers treat it as a boolean check.
  if (!isRazorpayConfigured()) return false;

  const { keySecret } = getRazorpayConfig();

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return safeCompare(expected, signature);
}

/**
 * Verify a webhook delivery. Razorpay signs the exact raw request body, so the
 * signature must be computed over the unparsed bytes - re-serialising the parsed
 * JSON changes key order and whitespace and invalidates the digest.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
  if (!rawBody || !signature) return false;

  // Same reasoning as verifyCheckoutSignature: reject rather than throw.
  if (!isRazorpayConfigured()) return false;

  const { webhookSecret } = getRazorpayConfig();

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeCompare(expected, signature);
}

/** Rupees to paise, the integer unit Razorpay works in. */
export function toPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}
