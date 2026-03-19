import ProductsFilterClient from '@/app/components/ProductsFilterClient';

export const metadata = {
  title: 'Trending Products | EcomZone',
  description: 'Check out the trending products everyone is loving right now',
};

export default function TrendingPage() {
  return (
    <ProductsFilterClient
      pageType="trending"
      title="Trending Products"
      description="Discover the hottest items everyone is loving"
      emoji="🔥"
      gradientFrom="from-orange-500"
      gradientVia="via-pink-500"
      gradientTo="to-red-500"
    />
  );
}