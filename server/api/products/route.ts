import { prisma } from '@/lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const search = req.query.search as string || "";
      const category = req.query.category as string || "";
      const categories = req.query.categories as string;
      const minPrice = req.query.minPrice as string;
      const maxPrice = req.query.maxPrice as string;
      const type = req.query.type as string;
  
      // Build where clause
      const where: any = { isActive: true };
      
      // Filter by product type
      if (type === "top-ranking") {
        where.isTopRanking = true;
      } else if (type === "trending") {
        where.isBestseller = true;
      } else if (type === "new-arrivals") {
        where.isNewArrival = true;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { productCode: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      
      // Support both single category and multiple categories
      if (categories) {
        const categoryList = categories.split(",").map(c => c.trim());
        where.categories = { hasSome: categoryList };
      } else if (category) {
        // For backward compatibility - check both single category and categories array
        where.OR = [
          { category: category },
          { categories: { has: category } }
        ];
      }
      
      if (minPrice || maxPrice) {
        where.singlePrice = {};
        if (minPrice) where.singlePrice.gte = parseFloat(minPrice);
        if (maxPrice) where.singlePrice.lte = parseFloat(maxPrice);
      }
  
      const products = await prisma.product.findMany({
        where,
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
  
      return res.json(transformedProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Error fetching products", error: error.message });
    }
  });

export default router;
