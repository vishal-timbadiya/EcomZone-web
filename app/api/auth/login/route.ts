import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signAuthToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/schemas';
import { enforceRateLimit, LOGIN_LIMIT } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, LOGIN_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Uniform response for "no such user" and "wrong password" so the endpoint
    // cannot be used to enumerate which email addresses have accounts.
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is disabled. Contact support.' },
        { status: 403 }
      );
    }

    const { valid, needsRehash } = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Transparently upgrade legacy AES credentials to bcrypt on successful login.
    if (needsRehash) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: await hashPassword(password) },
        });
      } catch (rehashError) {
        // A failed upgrade must not block a valid login; the next attempt retries.
        console.error('Password rehash failed for user', user.id, rehashError);
      }
    }

    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin || false,
      permissions: (user.permissions as Record<string, boolean>) || {},
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        isActive: user.isActive,
        permissions: user.permissions || {},
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Login failed' },
      { status: 500 }
    );
  }
}
