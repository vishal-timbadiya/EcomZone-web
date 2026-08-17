import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/lib/prisma';
import { hashPassword } from '@/lib/password';
import { signupSchema } from '@/lib/schemas';
import { enforceRateLimit, SIGNUP_LIMIT } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, SIGNUP_LIMIT);
  if (limited) return limited;

  try {
    const body = await request.json();

    // Input was previously unvalidated: any password (including an empty
    // string) and any malformed email or mobile were accepted.
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Validation failed',
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, mobile, password } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobile }] },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        password: await hashPassword(password),
      },
      // Explicit select. The whole Prisma record used to be returned, which
      // included the stored password.
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: 'User created', user }, { status: 201 });
  } catch (error: unknown) {
    // Unique constraint - another request created the same account concurrently.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    console.error('Signup Error:', error);

    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
