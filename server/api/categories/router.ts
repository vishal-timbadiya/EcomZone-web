import { Router } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string | null;
  productCount: number;
}

const router = Router();

router.get("/", async (req, res) => {
  try {
    // Get categories from the Category table ordered by position
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' }
    });

    if (categories.length === 0) {
      return res.json([]);
    }

    // Get product counts for each category
    const categoryCounts: CategoryWithCount[] = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.product.count({
          where: {
            OR: [
              { category: category.slug },
              { categories: { has: category.slug } }
            ],
            isActive: true
          }
        });

        return {
          ...category,
          productCount: count
        };
      })
    );

    return res.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json([]);
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '24');

    // Get category by slug
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get products for this category
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: slug },
              { categories: { has: slug } }
            ]
          }
        ]
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        productCode: true,
        imageUrl: true,
        singlePrice: true,
        cartonPrice: true,
        cartonQty: true,
        gstPercentage: true,
        category: true,
        stock: true,
        isBestseller: true,
        isNewArrival: true,
        isTopRanking: true,
        description: true
      }
    });

    // Get total count for pagination
    const total = await prisma.product.count({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { category: slug },
              { categories: { has: slug } }
            ]
          }
        ]
      }
    });

    const pages = Math.ceil(total / limit);

    return res.json({
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon
      },
      products,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    return res.status(500).json({
      error: 'Failed to fetch products',
      details: String(error)
    });
  }
});

export default router;
