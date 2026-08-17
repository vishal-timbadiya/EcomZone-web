import { Router, Request, Response } from 'express';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/password';
import { verifyAdminPermission } from '../../../../lib/adminAuth';

const router = Router();

router.post('/:id', async (req: Request, res: Response) => {
  try {
    const admin = await verifyAdminPermission(req, 'manageUsers');

    const { newPassword } = req.body as { newPassword?: string };

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isSuperAdmin: true },
    });

    if (!target) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Guard the super admin. Previously only the CALLER was checked, never the
    // target - so any sub-admin holding manageUsers could reset the super
    // admin's password and take over the account.
    if (target.isSuperAdmin && target.id !== admin.id) {
      return res.status(403).json({ message: "Cannot reset another super admin's password" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await hashPassword(newPassword),
        // Invalidate any outstanding self-service reset token.
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset Password Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error resetting password' });
  }
});

export default router;
