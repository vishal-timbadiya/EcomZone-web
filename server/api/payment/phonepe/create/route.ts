import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      const body = req.body;
      const { orderId, amount, userId } = body;
  
      if (!orderId || !amount || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const merchantId = process.env.PHONEPE_MERCHANT_ID!;
      const saltKey = process.env.PHONEPE_SALT_KEY!;
      const saltIndex = process.env.PHONEPE_SALT_INDEX!;
      const baseUrl = process.env.PHONEPE_BASE_URL!;
  
      if (!merchantId || !saltKey || !saltIndex || !baseUrl) {
        return res.status(500).json({ message: "PhonePe environment variables not configured" });
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
  
      return res.json(responseData);
    } catch (error: any) {
      console.error("PhonePe Create Payment Error:", error.message);
  
      return res.status(500).json({ message: "Payment initiation failed" });
    }
  });

export default router;
