import ProductsFilterClient from '@/app/components/ProductsFilterClient';

export const metadata = {
  title: 'New Arrivals | EcomZone',
  description: 'Check out our latest new arrival products',
};

export default function NewArrivalsPage() {
  return (
    <ProductsFilterClient
      pageType="new-arrivals"
      title="New Arrivals"
      description="Explore the newest products freshly added to our collection"
      emoji="✨"
      gradientFrom="from-green-500"
      gradientVia="via-emerald-500"
      gradientTo="to-teal-500"
    />
  );
}