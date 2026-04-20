import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

// Public endpoint - anyone can access to see payment settings
router.get('/public', async (req: Request, res: Response) => {
  try {
      // Try to find with fixed ID first, then fallback to findFirst
      let settings = await prisma.settings.findUnique({
        where: { id: 'default' }
      });
  
      if (!settings) {
        // Fallback to first record if it exists
        settings = await prisma.settings.findFirst();
      }
  
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.settings.create({
          data: { 
            id: 'default',
            codEnabled: true, 
            upiEnabled: true 
          },
        });
      }
  
      console.log('Fetched public settings:', settings);
      return res.json({ settings });
    } catch (error: any) {
      console.error("Public Settings Fetch Error:", error.message);
  
      return res.status(error.status || 500).json({ message: "Error fetching settings", error: error.message });
    }
  });

// Admin endpoint - requires authentication
router.get('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      // Try to find with fixed ID first, then fallback to findFirst
      let settings = await prisma.settings.findUnique({
        where: { id: 'default' }
      });
  
      if (!settings) {
        // Fallback to first record if it exists
        settings = await prisma.settings.findFirst();
      }
  
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.settings.create({
          data: { 
            id: 'default',
            codEnabled: true, 
            upiEnabled: true 
          },
        });
      }
  
      console.log('Fetched settings:', settings);
      return res.json({ settings });
    } catch (error: any) {
      console.error("Admin Settings Fetch Error:", error.message);
  
      return res.status(error.status || 500).json({ message: "Error fetching settings", error: error.message });
    }
  });

router.put('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const { codEnabled, upiEnabled } = body;

      console.log('Updating settings:', { codEnabled, upiEnabled });
  
      // Use upsert to create if doesn't exist, update if exists
      const updatedSettings = await prisma.settings.upsert({
        where: { id: 'default' }, // Use a fixed ID for singleton pattern
        update: { 
          codEnabled,
          upiEnabled
        },
        create: {
          id: 'default',
          codEnabled,
          upiEnabled
        }
      });

      console.log('Settings updated:', updatedSettings);
  
      return res.json({
        message: "Settings updated",
        updatedSettings,
      });
    } catch (error: any) {
      console.error("Admin Settings Update Error:", error.message);
  
      return res.status(error.status || 500).json({ message: "Unauthorized or update failed", error: error.message });
    }
  });

export default router;
