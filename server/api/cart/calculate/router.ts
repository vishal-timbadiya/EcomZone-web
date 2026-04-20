import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let cartSubtotal = 0;
    let cartGST = 0;

    const detailedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const singleQty = item.singleQty || 0;
      const cartonQty = item.cartonQty || 0;

      const singleTotal = singleQty * product.singlePrice;
      const cartonTotal = cartonQty * product.cartonPrice;

      const itemSubtotal = singleTotal + cartonTotal;
      const itemGST = (itemSubtotal * product.gstPercentage) / 100;

      cartSubtotal += itemSubtotal;
      cartGST += itemGST;

      detailedItems.push({
        productId: product.id,
        name: product.name,
        singleQty,
        cartonQty,
        itemSubtotal,
        itemGST,
      });
    }

    const cartTotal = cartSubtotal + cartGST;

    if (cartTotal < 2500) {
      return res.status(400).json({
        message: 'Minimum order value is ₹2500',
        cartSubtotal,
        cartGST,
        cartTotal,
      });
    }

    return res.json({
      message: 'Cart calculated successfully',
      cartSubtotal,
      cartGST,
      cartTotal,
      items: detailedItems,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Cart calculation failed',
      error: error.message,
    });
  }
});

export default router;
