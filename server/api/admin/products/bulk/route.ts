import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  console.log("🔄 Bulk update POST received");
  
    let updates: Array<{ id: string; changes: any }> = [];
  
    try {
      console.log("✅ Auth check starting...");
      await verifyAdmin(req);
      console.log("✅ Auth passed");
  
      const body = req.body;
      console.log("📦 Body received:", body);
  
      updates = body.updates as Array<{ id: string; changes: any }>;
  
      if (!Array.isArray(updates) || updates.length === 0) {
        console.log("❌ Invalid updates array");
        return res.status(400).json({ error: "Invalid updates array" });
      }
  
      if (updates.length > 100) {
        console.log(`⚠️ Large bulk update: ${updates.length} products`);
      }
  
      // Validate all IDs exist first
      const productIds = updates.map(u => u.id);
      console.log("🔍 Checking product IDs:", productIds);
      
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true }
      });
  
      const existingIds = new Set(existingProducts.map(p => p.id));
      const missingIds = updates
        .filter(u => !existingIds.has(u.id))
        .map(u => u.id);
  
      if (missingIds.length > 0) {
        console.log("❌ Missing products:", missingIds);
        return res.status(404).json({ error: "Some products not found", missing: missingIds });
      }
  
      console.log("✅ All products exist, starting transaction...");
      console.log("🔍 Changes being applied:", updates.map(u => ({ id: u.id, changes: u.changes })));
      
      // Atomic transaction
      const results = await prisma.$transaction(
        updates.map(({ id, changes }) =>
          prisma.product.update({
            where: { id },
            data: changes,
          })
        )
      );
  
      console.log(`✅ Transaction complete: ${results.length} updated`);
      console.log("📊 Updated products:", results.map(p => ({ id: p.id, category: p.category })));
  
      return res.json({
        success: results.length,
        failed: 0,
        updated: results.length,
        products: results
      });
  
    } catch (error: any) {
      console.error("💥 Bulk update ERROR:", error.message);
      console.error("Full error:", error);
      
      return res.status(error.status || 500).json({ 
          error: "Bulk update failed", 
          details: error.message,
          success: 0,
          failed: updates?.length || 0
        });
    }
  });

router.delete('/', async (req: Request, res: Response) => {
  console.log("🗑️ Bulk delete DELETE received");
    
    try {
      console.log("✅ Auth check starting...");
      await verifyAdmin(req);
      console.log("✅ Auth passed");
  
      const body = req.body;
      console.log("📦 Body received:", body);
      
      const productIds = body.productIds as string[];
  
      if (!Array.isArray(productIds) || productIds.length === 0) {
        console.log("❌ Invalid productIds array");
        return res.status(400).json({ error: "Invalid productIds array" });
      }
  
      if (productIds.length > 100) {
        console.log(`⚠️ Large bulk delete: ${productIds.length} products`);
      }
  
      // Validate all IDs exist first
      console.log("🔍 Checking product IDs:", productIds);
      
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true }
      });
  
      const existingIds = new Set(existingProducts.map(p => p.id));
      const missingIds = productIds.filter(id => !existingIds.has(id));
  
      if (missingIds.length > 0) {
        console.log("❌ Missing products:", missingIds);
        return res.status(404).json({ error: "Some products not found", missing: missingIds });
      }
  
      console.log("✅ All products exist, starting bulk delete...");
  
      // Delete in transaction: first delete related OrderItems, then products
      const result = await prisma.$transaction(async (tx) => {
        // Delete all OrderItems referencing these products
        const deletedItems = await tx.orderItem.deleteMany({
          where: { productId: { in: productIds } }
        });
        console.log(`🗑️ Deleted ${deletedItems.count} order items`);
  
        // Then delete the products
        const deletedProducts = await tx.product.deleteMany({
          where: { id: { in: productIds } }
        });
        console.log(`🗑️ Deleted ${deletedProducts.count} products`);
  
        return deletedProducts;
      });
  
      console.log(`✅ Bulk delete complete: ${result.count} deleted`);
  
      return res.json({
        success: result.count,
        deleted: result.count,
        message: `${result.count} products deleted successfully`
      });
  
    } catch (error: any) {
      console.error("💥 Bulk delete ERROR:", error.message);
      console.error("Full error:", error);
      
      return res.status(error.status || 500).json({ 
          error: "Bulk delete failed", 
          details: error.message,
          success: 0,
          deleted: 0
        });
    }
  });

export default router;
