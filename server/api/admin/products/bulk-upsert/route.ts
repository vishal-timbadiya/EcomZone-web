import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

// Helper function to generate unique slug
async function generateUniqueSlug(baseSlug: string, productCode: string, tx: any): Promise<string> {
  let slug = baseSlug;
  
  // First try with just the base slug
  let existing = await tx.product.findUnique({
    where: { slug }
  }).catch(() => null);
  
  if (!existing) {
    return slug;
  }
  
  // If base slug exists, try with productCode suffix
  slug = `${baseSlug}-${productCode}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  existing = await tx.product.findUnique({
    where: { slug }
  }).catch(() => null);
  
  if (!existing) {
    return slug;
  }
  
  // If still exists, add timestamp
  slug = `${baseSlug}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug;
}

router.post('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const products = body.products as any[];
  
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid products data' });
      }
  
      // Process products one by one instead of in a single transaction
      // to avoid transaction abort issues
      const added = [];
      const updated = [];
      const errors = [];
  
      for (const productData of products) {
        try {
          // Generate unique slug
          const baseSlug = (productData.slug || productData.name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          const uniqueSlug = `${baseSlug}-${productData.productCode}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          // Check if product exists by productCode
          const existing = await prisma.product.findUnique({
            where: { productCode: productData.productCode }
          });
  
          if (existing) {
            // UPDATE existing product
            const updated_product = await prisma.product.update({
              where: { productCode: productData.productCode },
              data: {
                name: productData.name,
                slug: uniqueSlug,
                description: productData.description,
                singlePrice: productData.singlePrice,
                cartonPrice: productData.cartonPrice || 0,
                cartonPcsPrice: productData.cartonPcsPrice || 0,
                cartonQty: productData.cartonQty || 1,
                gstPercentage: productData.gstPercentage || 18,
                hsnCode: productData.hsnCode || '',
                weight: productData.weight || 0,
                stock: productData.stock || 0,
                category: productData.category || 'general',
                subCategory: productData.subCategory || 'basic',
                isBestseller: productData.isBestseller || false,
                isNewArrival: productData.isNewArrival || false,
                isTopRanking: productData.isTopRanking || false,
                imageUrl: productData.imageUrl || '',
                imageUrls: typeof productData.imageUrls === 'string' ? JSON.parse(productData.imageUrls) : productData.imageUrls || [],
                categories: typeof productData.categories === 'string' ? productData.categories.split(',') : productData.categories || [],
              }
            });
            updated.push(updated_product);
          } else {
            // CREATE new product
            const new_product = await prisma.product.create({
              data: {
                productCode: productData.productCode,
                name: productData.name,
                slug: uniqueSlug,
                description: productData.description,
                singlePrice: productData.singlePrice,
                cartonPrice: productData.cartonPrice || 0,
                cartonPcsPrice: productData.cartonPcsPrice || 0,
                cartonQty: productData.cartonQty || 1,
                gstPercentage: productData.gstPercentage || 18,
                hsnCode: productData.hsnCode || '',
                weight: productData.weight || 0,
                stock: productData.stock || 0,
                category: productData.category || 'general',
                subCategory: productData.subCategory || 'basic',
                isBestseller: productData.isBestseller || false,
                isNewArrival: productData.isNewArrival || false,
                isTopRanking: productData.isTopRanking || false,
                imageUrl: productData.imageUrl || '',
                imageUrls: typeof productData.imageUrls === 'string' ? JSON.parse(productData.imageUrls) : productData.imageUrls || [],
                categories: typeof productData.categories === 'string' ? productData.categories.split(',') : productData.categories || [],
              }
            });
            added.push(new_product);
          }
        } catch (err: any) {
          errors.push(`Product "${productData.name}" (${productData.productCode}): ${err.message}`);
        }
      }
  
      return res.json({
        success: true,
        added: added.length,
        updated: updated.length,
        total: products.length,
        addedProducts: added,
        updatedProducts: updated,
        errors: errors,
        message: `Successfully processed ${products.length} products: ${added.length} new products added, ${updated.length} existing products updated.`
      });
  
    } catch (error: any) {
      console.error('Bulk upsert error:', error);
      return res.status(error.status || 500).json({ error: error.message });
    }
  });

export default router;
