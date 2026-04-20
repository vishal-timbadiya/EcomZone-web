import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  
  try {
    const res = await fetch(`${apiUrl}/products`, { 
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      console.error(`API returned ${res.status} for products endpoint`);
      return [
        {
          url: "https://ecomzone.in",
          lastModified: new Date(),
        },
      ];
    }
    
    const data = await res.json();
    const products = Array.isArray(data) ? data : (data.products || []);

    const productUrls = products.map((product: any) => ({
      url: `https://ecomzone.in/product/${product.slug}`,
      lastModified: new Date(),
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