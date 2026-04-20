import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// GET all shipping rates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rates = await prisma.shippingRate.findMany({
      where: { isActive: true },
      orderBy: { state: 'asc' }
    });
    
    return res.json({ rates });
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch shipping rates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET shipping rate by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const rate = await prisma.shippingRate.findUnique({
      where: { id }
    });
    
    if (!rate) {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }
    
    return res.json(rate);
  } catch (error) {
    console.error('Error fetching shipping rate:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch shipping rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CREATE new shipping rate
router.post('/', async (req: Request, res: Response) => {
  try {
    const { state, city, ratePerKg } = req.body;
    
    if (!state || ratePerKg === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['state', 'ratePerKg']
      });
    }
    
    // Check if rate already exists for this state/city combination
    const existing = await prisma.shippingRate.findUnique({
      where: {
        state_city: { state, city: city || null }
      }
    });
    
    if (existing) {
      return res.status(409).json({ 
        error: 'Shipping rate already exists for this state/city combination'
      });
    }
    
    const rate = await prisma.shippingRate.create({
      data: {
        state,
        city: city || null,
        ratePerKg: parseFloat(ratePerKg)
      }
    });
    
    return res.status(201).json(rate);
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    return res.status(500).json({ 
      error: 'Failed to create shipping rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// UPDATE shipping rate
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ratePerKg, isActive } = req.body;
    
    const updateData: any = {};
    if (ratePerKg !== undefined) updateData.ratePerKg = parseFloat(ratePerKg);
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        error: 'No valid fields to update',
        validFields: ['ratePerKg', 'isActive']
      });
    }
    
    const rate = await prisma.shippingRate.update({
      where: { id },
      data: updateData
    });
    
    return res.json(rate);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }
    console.error('Error updating shipping rate:', error);
    return res.status(500).json({ 
      error: 'Failed to update shipping rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE shipping rate
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.shippingRate.delete({
      where: { id }
    });
    
    return res.json({ message: 'Shipping rate deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Shipping rate not found' });
    }
    console.error('Error deleting shipping rate:', error);
    return res.status(500).json({ 
      error: 'Failed to delete shipping rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
