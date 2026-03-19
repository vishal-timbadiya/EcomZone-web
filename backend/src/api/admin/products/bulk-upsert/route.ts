import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const body = await request.json();
    const products = body.products as any[];

    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    // Transactional upsert
    const result = await prisma.$transaction(async (tx) => {
      const added = [];
      const updated = [];
      const errors = [];

      for (const productData of products) {
        try {
          // Check if product exists by productCode
          const existing = await tx.product.findUnique({
            where: { productCode: productData.productCode }
          });

          if (existing) {
            // UPDATE existing product
            const updated_product = await tx.product.update({
              where: { productCode: productData.productCode },
              data: {
                name: productData.name,
                slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
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
            const new_product = await tx.product.create({
              data: {
                productCode: productData.productCode,
                name: productData.name,
                slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
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

      return { added, updated, errors };
    });

    return NextResponse.json({
      success: true,
      added: result.added.length,
      updated: result.updated.length,
      total: products.length,
      addedProducts: result.added,
      updatedProducts: result.updated,
      errors: result.errors,
      message: `Successfully processed ${products.length} products: ${result.added.length} new products added, ${result.updated.length} existing products updated.`
    });

  } catch (error: any) {
    console.error('Bulk upsert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
