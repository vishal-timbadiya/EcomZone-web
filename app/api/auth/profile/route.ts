import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { extractBearerToken, verifyAuthToken } from '@/lib/jwt';

function getTokenFromRequest(request: NextRequest): string | null {
  return extractBearerToken(request.headers.get('authorization'));
}

const verifyToken = verifyAuthToken;

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        gstNumber: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, gstNumber } = body;

    // Only these three fields are editable. `email` and `address` used to be
    // accepted and silently dropped, and the response then echoed the unchanged
    // email back as though it had been saved.
    if (body.email !== undefined || body.address !== undefined) {
      return NextResponse.json(
        { error: 'Email and address cannot be changed here' },
        { status: 400 }
      );
    }

    if (phone !== undefined && !/^[0-9]{10}$/.test(String(phone))) {
      return NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(phone !== undefined ? { mobile: String(phone) } : {}),
        ...(gstNumber !== undefined ? { gstNumber: String(gstNumber) } : {}),
      }
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        gstNumber: updatedUser.gstNumber
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}