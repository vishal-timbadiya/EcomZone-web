import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/server/lib/prisma';
import { forgotPasswordSchema } from '@/lib/schemas';
import { enforceRateLimit, FORGOT_PASSWORD_LIMIT } from '@/lib/rateLimit';
import { sendMail } from '@/server/lib/mailer';

/** Identical response in every case, so the endpoint cannot enumerate accounts. */
const GENERIC_RESPONSE = {
  message: 'If an account exists with this email, you will receive a password reset link.',
};

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, FORGOT_PASSWORD_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'A valid email address is required' }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Store only a hash of the token. A database leak then does not hand the
    // attacker working reset links.
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
