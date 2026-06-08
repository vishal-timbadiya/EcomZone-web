import { MetadataRoute } from "next";
import { prisma } from "@/server/lib/prisma";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const products = await prisma.product.findMany({
      select: { slug: true, createdAt: true },
      where: { isActive: true },
    });

    const productUrls = products.map((product) => ({
      url: `https://ecomzone.in/product/${product.slug}`,
      lastModified: product.createdAt || new Date(),
    }));

    return [
      {
        url: "https://ecomzone.in",
        lastModified: new Date(),
      },
      ...productUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [
      {
        url: "https://ecomzone.in",
        lastModified: new Date(),
      },
    ];
  }
}