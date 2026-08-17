import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/server/lib/prisma';
import { hashPassword } from '@/lib/password';
import { resetPasswordSchema } from '@/lib/schemas';
import { enforceRateLimit, FORGOT_PASSWORD_LIMIT } from '@/lib/rateLimit';

/**
 * Consume a password reset token.
 *
 * forgot-password has always issued these tokens and emailed a link to
 * /reset-password, but nothing ever consumed them - the flow dead-ended on a
 * 404. This is the missing half.
 */
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, FORGOT_PASSWORD_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // The database stores the SHA-256 of the token, not the token itself.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
        // Single use - clear the token so the link cannot be replayed.
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('RESET PASSWORD ERROR:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
