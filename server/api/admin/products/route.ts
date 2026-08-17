import { randomBytes } from 'crypto';
import { prisma } from '../../../lib/prisma';
import { verifyAdmin } from '../../../lib/adminAuth';
import { Router, Request, Response } from 'express';

const router = Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

router.get('/', async (req: Request, res: Response) => {
  try {
      await verifyAdmin(req);
  
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
      );
      const offset = Math.max(parseInt(String(req.query.offset ?? 0), 10) || 0, 0);

      const products = await prisma.product.findMany({
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
  
      return res.json({ products: transformedProducts });
    } catch (error: any) {
      console.error("Admin Products GET Error:", error.message);
      return res.status(error.status || 500).json({ message: "Error fetching products" });
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
  
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }

      // Generate base slug
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
  
      // Append random entropy rather than probing the database in a loop. The
      // old while-loop issued one query per collision and still raced: two
      // concurrent creates could both find the same slug free before writing.
      const existing = await prisma.product.findUnique({
        where: { slug: baseSlug },
        select: { id: true },
      });

      const slug = existing
        ? `${baseSlug}-${randomBytes(3).toString('hex')}`
        : baseSlug || randomBytes(6).toString('hex');
  
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
  
      return res
        .status(error.status || 500)
        .json({ message: error.status ? error.message : 'Error creating product' });
    }
  });

export default router;



