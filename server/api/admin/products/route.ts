import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
  
      // Transform products to ensure proper JSON serialization
      const transformedProducts = products.map((product: any) => ({
        ...product,
        categories: Array.isArray(product.categories) 
          ? product.categories 
          : [],
        imageUrls: Array.isArray(product.imageUrls) 
          ? product.imageUrls 
          : product.imageUrls 
            ? JSON.parse(JSON.stringify(product.imageUrls)) 
            : [],
      }));
  
      return res.json({ products: transformedProducts });
    } catch (error: any) {
      console.error("Admin Products GET Error:", error.message);
      return res.status(error.status || 500).json({ message: "Error fetching products", error: error.message });
    }
  });

router.post('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const body = req.body;
      const {
        productCode,
        name,
        description,
        imageUrl,
        imageUrls,
        singlePrice,
        cartonPrice,
        cartonPcsPrice,
        cartonQty,
        gstPercentage,
        hsnCode,
        weight,
        stock,
        category,
        categories,
        subCategory,
        isBestseller,
        isNewArrival,
        isTopRanking,
      } = body;
  
      // Generate base slug
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
  
      let slug = baseSlug;
      let counter = 0;
  
      // Check for existing slug and make it unique
      while (await prisma.product.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
  
      const product = await prisma.product.create({
        data: {
          productCode: productCode || null,
          name,
          slug,
          description,
          imageUrl: imageUrl || "",
          imageUrls: imageUrls || [],
          singlePrice: singlePrice || 0,
          cartonPrice: cartonPrice || 0,
          cartonPcsPrice: cartonPcsPrice || 0,
          cartonQty: cartonQty || 1,
          gstPercentage: gstPercentage || 0,
          hsnCode: hsnCode || "",
          weight: weight || 0,
          stock: stock || 0,
          category: (category || "general").toLowerCase().replace(/\s+/g, "-"),
          categories: categories || [],
          subCategory: subCategory || "basic",
          isBestseller: isBestseller || false,
          isNewArrival: isNewArrival || false,
          isTopRanking: isTopRanking || false,
        },
      });
  
      return res.json({
        message: "Product created",
        product,
      });
    } catch (error: any) {
      console.error("Admin Product Error:", error.message);
      console.error("Error details:", error);
  
      return res.status(error.status || 500).json({ message: `Error creating product: ${error.message}` });
    }
  });

export default router;
