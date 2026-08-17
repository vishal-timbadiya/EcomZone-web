import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hashPassword } from '../lib/password';

/**
 * Create or update the super admin account.
 *
 * The login route used to accept SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
 * directly from the environment, compare the password with ===, and create the
 * account on the fly - meaning the highest-privilege account in the system was
 * provisioned by an unauthenticated request path. That belongs here instead.
 *
 * Usage:
 *   SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='<strong password>' npm run db:seed-admin
 *
 * Safe to re-run: it upserts, and resets the password to the supplied value.
 */
async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
  const mobile = process.env.SUPER_ADMIN_MOBILE || '0000000000';

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must both be set');
  }

  if (password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters');
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new pg.Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const hashed = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashed,
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true,
      },
      create: {
        name,
        email,
        mobile,
        password: hashed,
        role: 'ADMIN',
        isSuperAdmin: true,
        isActive: true,
      },
      select: { id: true, email: true },
    });

    console.log(`Super admin ready: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
