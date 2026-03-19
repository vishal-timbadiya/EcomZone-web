import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, amount, userId } = body;

    if (!orderId || !amount || !userId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;
    const baseUrl = process.env.PHONEPE_BASE_URL!;

    if (!merchantId || !saltKey || !saltIndex || !baseUrl) {
      return NextResponse.json(
        { message: "PhonePe environment variables not configured" },
        { status: 500 }
      );
    }

    // Convert ₹ to paisa
    const amountInPaise = Math.round(Number(amount) * 100);

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: orderId,
      merchantUserId: userId,
      amount: amountInPaise,
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/phonepe/webhook`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString("base64");

    // Create SHA256 checksum
    const stringToHash = payloadBase64 + "/pg/v1/pay" + saltKey;

    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");

    const checksum = sha256 + "###" + saltIndex;

    const phonepeResponse = await fetch(
      `${baseUrl}/pg/v1/pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({
          request: payloadBase64,
        }),
      }
    );

    const responseData = await phonepeResponse.json();

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("PhonePe Create Payment Error:", error.message);

    return NextResponse.json(
      { message: "Payment initiation failed" },
      { status: 500 }
    );
  }
}