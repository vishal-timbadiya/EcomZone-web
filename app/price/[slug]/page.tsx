import PriceClient from "./PriceClient";

const PRICE_RANGE_SLUGS = [
  "under-9",
  "under-49",
  "under-99",
  "under-149",
  "under-249",
  "under-499",
  "499-plus",
];

export function generateStaticParams() {
  return PRICE_RANGE_SLUGS.map((slug) => ({ slug }));
}

export default async function PricePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PriceClient slug={slug} />;
}

