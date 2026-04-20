import { Metadata } from "next";
import ProductClient from "./ProductClient";

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${apiUrl}/products`, { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      const products = Array.isArray(data) ? data : data.products || [];
      const slugs = products.map((p: { slug: string }) => ({ slug: p.slug }));
      if (slugs.length > 0) return slugs;
    }
  } catch {
    // API unavailable at build time
  }
  // Fallback: ensures output:export does not fail when API is offline at build time
  return [{ slug: "placeholder" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {

  const { slug } = await params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(
      `${apiUrl}/products/${slug}`,
      { cache: "force-cache" }
    );

    if (!res.ok) {
      return {
        title: "Product Not Found",
      };
    }

    const product = await res.json();

    if (!product) {
      return {
        title: "Product Not Found",
      };
    }

    return {
      title: product.name,
      description: product.description,
      openGraph: {
        title: product.name,
        description: product.description,
        images: [
          {
            url: product.imageUrl,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product Not Found",
    };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = await params;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  
  try {
    const res = await fetch(
      `${apiUrl}/products/${slug}`,
      { cache: "force-cache" }
    );

    if (!res.ok) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Product Not Found</h1>
            <p className="text-gray-500 mt-2">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      );
    }

    const product = await res.json();

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: product.imageUrl,
      description: product.description,
      brand: {
        "@type": "Brand",
        name: "EcomZone",
      },
      offers: {
        "@type": "Offer",
        price: product.singlePrice,
        priceCurrency: "INR",
        availability:
          product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        url: `https://ecomzone.in/product/${slug}`,
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <ProductClient product={product} />
      </>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Product</h1>
          <p className="text-gray-500 mt-2">Unable to load the product. Please try again later.</p>
        </div>
      </div>
    );
  }
}