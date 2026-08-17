import { Router, Request, Response } from 'express';
import { prisma } from '../../../lib/prisma';
import { verifyAdminPermission } from '../../../lib/adminAuth';

const router = Router();

const SETTINGS_ID = 'default';

/** Used when no settings row exists yet, so a read never has to write one. */
const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  codEnabled: true,
  upiEnabled: true,
};

async function readSettings() {
  const settings =
    (await prisma.settings.findUnique({ where: { id: SETTINGS_ID } })) ??
    (await prisma.settings.findFirst());

  return settings ?? DEFAULT_SETTINGS;
}

/**
 * Public endpoint - the storefront needs to know which payment methods are on
 * before the customer has an account.
 *
 * It no longer creates a settings row as a side effect: an unauthenticated GET
 * must never write to the database.
 */
router.get('/public', async (_req: Request, res: Response) => {
  try {
    const settings = await readSettings();

    return res.json({
      settings: {
        codEnabled: settings.codEnabled,
        upiEnabled: settings.upiEnabled,
      },
    });
  } catch (error: any) {
    console.error('Public Settings Fetch Error:', error?.message);
    return res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    await verifyAdminPermission(req, 'systemSettings');

    return res.json({ settings: await readSettings() });
  } catch (error: any) {
    console.error('Admin Settings Fetch Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Error fetching settings' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    await verifyAdminPermission(req, 'systemSettings');

    const { codEnabled, upiEnabled } = req.body as Record<string, unknown>;

    if (typeof codEnabled !== 'boolean' || typeof upiEnabled !== 'boolean') {
      return res
        .status(400)
        .json({ message: 'codEnabled and upiEnabled must be booleans' });
    }

    const updatedSettings = await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      update: { codEnabled, upiEnabled },
      create: { id: SETTINGS_ID, codEnabled, upiEnabled },
    });

    return res.json({ message: 'Settings updated', updatedSettings });
  } catch (error: any) {
    console.error('Admin Settings Update Error:', error?.message);
    return res
      .status(error?.status || 500)
      .json({ message: error?.status ? error.message : 'Settings update failed' });
  }
});

export default router;
