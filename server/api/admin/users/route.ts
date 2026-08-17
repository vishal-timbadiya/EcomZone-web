import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../../lib/password';
import { verifyAdminPermission } from '../../../lib/adminAuth';

const router = Router();

const PAGE_SIZE_DEFAULT = 50;
const PAGE_SIZE_MAX = 200;

/**
 * List users.
 *
 * The password column is deliberately NOT selected. This endpoint previously
 * selected it and then decrypted every password before returning them, which
 * exposed every customer credential in the system to anyone holding an admin
 * session. Passwords are now one-way hashed and cannot be displayed at all;
 * use the reset-password endpoint instead.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdminPermission(req, 'manageUsers');

    const take = Math.min(
      Math.max(parseInt(String(req.query.limit ?? PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT, 1),
      PAGE_SIZE_MAX
    );
    const skip = Math.max(parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          isActive: true,
          isSuperAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.user.count(),
    ]);

    return res.json({ users, total, limit: take, offset: skip });
  } catch (error: any) {
    console.error('Get Users Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error fetching users' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const admin = await verifyAdminPermission(req, 'manageUsers');

    const { name, email, mobile, password, role } = req.body as Record<string, string>;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Only a super admin may mint another admin. Without this an admin holding
    // manageUsers could create peers and escalate sideways.
    const requestedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    if (requestedRole === 'ADMIN' && !admin.isSuperAdmin) {
      return res.status(403).json({ message: 'Only a super admin can create admin accounts' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        mobile: mobile || '',
        password: await hashPassword(password),
        role: requestedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    console.error('Create User Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error creating user' });
  }
});

export default router;
