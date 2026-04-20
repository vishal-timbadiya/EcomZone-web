import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const products = body.products as any[];
  
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid products data' });
      }
  
      const created = [];
      const updated = [];
      const errors = [];
      let successCount = 0;
      const batchCodes = new Set<string>(); // Track productCodes in this batch
  
      // Process products one by one
      for (const productData of products) {
        try {
          const productCode = String(productData.productCode || '').trim();
          
          if (!productCode) {
            errors.push(`Product "${productData.name}": Product code is required`);
            continue;
          }
  
          // Check for duplicate productCode within the same batch
          if (batchCodes.has(productCode)) {
            errors.push(`Product "${productData.name}": Duplicate product code "${productCode}" in batch (already processed in this import)`);
            continue;
          }
  
          // Generate slug from productCode for uniqueness
          const slug = productCode.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
          // Check if product with this productCode exists in database
          const existingProduct = await prisma.product.findUnique({
            where: { productCode }
          });
  
          const productPayload = {
            ...productData,
            productCode,
            slug,
            imageUrls: typeof productData.imageUrls === 'string' ? JSON.parse(productData.imageUrls) : productData.imageUrls || [],
            categories: typeof productData.categories === 'string' ? productData.categories.split(',') : productData.categories || [],
          };
  
          if (existingProduct) {
            // Update existing product
            const product = await prisma.product.update({
              where: { productCode },
              data: productPayload
            });
            updated.push(product);
            successCount++;
          } else {
            // Create new product
            const product = await prisma.product.create({
              data: productPayload
            });
            created.push(product);
            successCount++;
          }
  
          // Add productCode to batch tracking after successful insert/update
          batchCodes.add(productCode);
        } catch (err: any) {
          console.error(`Error processing product "${productData.name}":`, err);
          errors.push(`Product "${productData.name}": ${err.message}`);
        }
      }
  
      const processedCount = created.length + updated.length;
      return res.json({
        success: true,
        added: created.length,
        updated: updated.length,
        processed: processedCount,
        total: processedCount,
        skipped: products.length - processedCount,
        errors,
        message: `Successfully processed ${processedCount} products (${created.length} created, ${updated.length} updated)${errors.length > 0 ? ` - ${errors.length} skipped due to errors` : ''}`
      });
  
    } catch (error: any) {
      console.error('Bulk save error:', error);
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

export default router;
