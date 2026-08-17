import { Metadata } from "next";
import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      select: { slug: true },
      where: { isActive: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    // Database unavailable at build time
    return [{ slug: "placeholder" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
    });

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
            url: product.imageUrl || "",
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

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
    });

    if (!product) {
      notFound();
    }

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
            // JSON.stringify does not escape "<", so a product name or
            // description containing "</script>" would close this tag and
            // execute whatever followed.
            __html: JSON.stringify(structuredData).replace(/</g, '\u003c'),
          }}
        />
        <ProductClient product={product as any} />
      </>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    notFound();
  }
}