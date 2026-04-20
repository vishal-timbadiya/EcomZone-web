import { verifyAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router();

router.put('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
      const body = req.body;
      const { productIds, action, data } = body;
  
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, message: "No products selected" });
      }
  
      if (!action) {
        return res.status(400).json({ success: false, message: "No action specified" });
      }
  
      const updateData: any = {};
  
      switch (action) {
        case "setActive":
          updateData.isActive = data.isActive;
          break;
        case "setBestseller":
          updateData.isBestseller = data.isBestseller;
          break;
        case "setNewArrival":
          updateData.isNewArrival = data.isNewArrival;
          break;
        case "setTopRanking":
          updateData.isTopRanking = data.isTopRanking;
          break;
        case "setCategory":
          updateData.category = data.category;
          break;
        case "setCategories":
          updateData.categories = data.categories || [];
          break;
        case "setStock":
          updateData.stock = data.stock;
          break;
        case "setHSN":
          updateData.hsnCode = data.hsnCode;
          break;
        case "setPrice":
          updateData.singlePrice = data.singlePrice;
          break;
        case "setWeight":
          updateData.weight = data.weight;
          break;
        default:
          return res.status(400).json({ success: false, message: "Invalid action" });
      }
  
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: updateData,
      });
  
      return res.json({
        success: true,
        count: result.count,
        message: `${result.count} products updated`
      });
  
    } catch (error: any) {
      console.error("Bulk update error:", error);
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
  });

router.delete('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
      const body = req.body;
      const { productIds } = body;
  
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, message: "No products selected" });
      }
  
      const result = await prisma.product.deleteMany({
        where: { id: { in: productIds } },
      });
  
      return res.json({
        success: true,
        count: result.count,
        message: `${result.count} products deleted`
      });
  
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      return res.status(error.status || 500).json({ success: false, message: error.message });
    }
  });

export default router;
