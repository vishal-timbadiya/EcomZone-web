import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, orderId } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"EcomZone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Order Confirmation',
      html: `
        <h2>Order Confirmed</h2>
        <p>Your Order ID: <strong>${orderId}</strong></p>
      `,
    });

    return res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('EMAIL ERROR:', error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
