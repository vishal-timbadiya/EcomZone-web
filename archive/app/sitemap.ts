import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await fetch("http://localhost:3000/api/products");
  const products = await res.json();

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
}