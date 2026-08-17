/**
 * Razorpay Checkout loader and launcher for the browser.
 *
 * The gateway script is injected on demand rather than on every page load, so
 * pages that never take a payment do not pull in a third-party script.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let loader: Promise<boolean> | null = null;

export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loader) return loader;

  loader = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);

    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      loader = null;
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return loader;
}

export interface RazorpaySession {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface OpenCheckoutOptions {
  session: RazorpaySession;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
}

/**
 * Open the payment sheet.
 *
 * Resolves with the gateway response on success, or null if the customer
 * dismissed the sheet without paying. The response is NOT trusted here - the
 * caller must send it to the server, which verifies the signature.
 */
export function openRazorpayCheckout(options: OpenCheckoutOptions): Promise<RazorpayResult | null> {
  const { session, customerName, customerEmail, customerContact } = options;

  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Payment gateway failed to load'));
      return;
    }

    let settled = false;

    const checkout = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      order_id: session.razorpayOrderId,
      name: 'EcomZone',
      description: `Order ${session.orderId}`,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerContact || '',
      },
      notes: { ecomzoneOrderId: session.orderId },
      theme: { color: '#f97316' },
      handler: (response: RazorpayResult) => {
        settled = true;
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          if (!settled) resolve(null);
        },
      },
    });

    checkout.open();
  });
}
