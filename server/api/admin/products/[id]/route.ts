import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error: any) {
    console.error("Get Product Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error fetching product" });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    const body = req.body;

    // Build update data object - only include fields that are provided
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.productCode !== undefined) updateData.productCode = body.productCode;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.imageUrls !== undefined) updateData.imageUrls = body.imageUrls;
    if (body.singlePrice !== undefined) updateData.singlePrice = body.singlePrice;
    if (body.cartonPrice !== undefined) updateData.cartonPrice = body.cartonPrice;
    if (body.cartonPcsPrice !== undefined) updateData.cartonPcsPrice = body.cartonPcsPrice;
    if (body.cartonQty !== undefined) updateData.cartonQty = body.cartonQty;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.gstPercentage !== undefined) updateData.gstPercentage = body.gstPercentage;
    if (body.hsnCode !== undefined) updateData.hsnCode = body.hsnCode;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.subCategory !== undefined) updateData.subCategory = body.subCategory;
    if (body.isBestseller !== undefined) updateData.isBestseller = body.isBestseller;
    if (body.isNewArrival !== undefined) updateData.isNewArrival = body.isNewArrival;
    if (body.isTopRanking !== undefined) updateData.isTopRanking = body.isTopRanking;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    console.log('🔍 Single product update - ID:', id);
    console.log('📦 Update data to be applied:', updateData);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedProduct);
  } catch (error: any) {
    console.error("Update Product Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error updating product: " + error.message });
  }
});

router.delete('/', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await verifyAdmin(req);

    await prisma.product.delete({
      where: { id },
    });

    return res.json({ message: "Product deleted" });
  } catch (error: any) {
    console.error("Delete Product Error:", error.message);
    return res.status(error.status || 500).json({ message: "Error deleting product" });
  }
});

export default router;
