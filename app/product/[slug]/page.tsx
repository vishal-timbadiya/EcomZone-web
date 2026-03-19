import { Metadata } from "next";
import ProductClient from "./ProductClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {

  const { slug } = await params;

  const res = await fetch(
    `http://localhost:3000/api/products/${slug}`,
    { cache: "no-store" }
  );

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
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = await params;

  const res = await fetch(
    `http://localhost:3000/api/products/${slug}`,
    { cache: "no-store" }
  );

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
}