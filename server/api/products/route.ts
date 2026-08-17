import { prisma } from '../../lib/prisma';
import { Router, Request, Response } from 'express';

const router = Router();

// The storefront renders whole category grids, so the default page is large,
// but it is no longer unbounded.
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

router.get('/', async (req: Request, res: Response) => {
  try {
      const search = req.query.search as string || "";
      const category = req.query.category as string || "";
      const categories = req.query.categories as string;
      const minPrice = req.query.minPrice as string;
      const maxPrice = req.query.maxPrice as string;
      const type = req.query.type as string;
  
      // Pagination. Every list endpoint previously returned the entire table.
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
      );
      const offset = Math.max(parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

      // Build where clause.
      //
      // Conditions are collected into AND rather than assigned to `where.OR`.
      // Search and category each wrote to `where.OR` directly, so passing both
      // meant the category clause overwrote the search and the search term was
      // silently ignored.
      const conditions: any[] = [{ isActive: true }];

      // Filter by product type
      if (type === "top-ranking") {
        conditions.push({ isTopRanking: true });
      } else if (type === "trending") {
        conditions.push({ isBestseller: true });
      } else if (type === "new-arrivals") {
        conditions.push({ isNewArrival: true });
      }

      if (search) {
        conditions.push({
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { productCode: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        });
      }

      // Support both single category and multiple categories
      if (categories) {
        const categoryList = categories.split(",").map(c => c.trim()).filter(Boolean);
        if (categoryList.length > 0) {
          conditions.push({ categories: { hasSome: categoryList } });
        }
      } else if (category) {
        // For backward compatibility - check both single category and categories array
        conditions.push({
          OR: [
            { category: category },
            { categories: { has: category } },
          ],
        });
      }

      const priceFilter: any = {};
      const parsedMin = minPrice !== undefined ? parseFloat(minPrice) : NaN;
      const parsedMax = maxPrice !== undefined ? parseFloat(maxPrice) : NaN;

      if (Number.isFinite(parsedMin)) priceFilter.gte = parsedMin;
      if (Number.isFinite(parsedMax)) priceFilter.lte = parsedMax;
      if (Object.keys(priceFilter).length > 0) {
        conditions.push({ singlePrice: priceFilter });
      }

      const where = { AND: conditions };

      const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
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


