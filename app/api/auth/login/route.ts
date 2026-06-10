import { prisma } from '@/server/lib/prisma';
import { encryptPassword, decryptPassword } from '@/lib/encryption';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';

// Super admin credentials from environment variables
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@ecomzone.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

// Validate required env vars
if (!SUPER_ADMIN_PASSWORD) {
  console.warn('⚠️ SUPER_ADMIN_PASSWORD environment variable is not set');
}

export async function POST(request: NextRequest) {
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

    // Check if it's the super admin
    if (email === SUPER_ADMIN_EMAIL && SUPER_ADMIN_PASSWORD) {
      const isPasswordValid = password === SUPER_ADMIN_PASSWORD;

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Check if super admin exists in database, if not create
      let superAdmin = await prisma.user.findUnique({
        where: { email },
      });

      if (!superAdmin) {
        superAdmin = await prisma.user.create({
          data: {
            name: "Super Admin",
            email,
            mobile: "0000000000",
            password: encryptPassword(SUPER_ADMIN_PASSWORD),
            role: "ADMIN",
            isSuperAdmin: true,
          },
        });
      }

      // Access token: 15 minutes
      const token = jwt.sign(
        { userId: superAdmin.id, role: superAdmin.role, isSuperAdmin: true },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" }
      );

      return NextResponse.json({
        message: "Login successful",
        token,
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          isSuperAdmin: true,
        },
      });
    }

    // Regular user login (customer, admin, or sub-admin)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Account is disabled. Contact support." },
        { status: 403 }
      );
    }

    // Check if password is bcrypt hash (starts with $2)
    const isBcrypt = user.password.startsWith("$2");

    let isPasswordValid = false;

    if (isBcrypt) {
      // Use bcrypt comparison for bcrypt-hashed passwords
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Use CryptoJS decryption for AES-encrypted passwords
      const decryptedPassword = decryptPassword(user.password);
      isPasswordValid = password === decryptedPassword;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin || false,
        permissions: user.permissions || {},
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    return NextResponse.json({
      message: "Login successful",
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
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}