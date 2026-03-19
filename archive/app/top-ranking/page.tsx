import ProductsFilterClient from '@/app/components/ProductsFilterClient';

export const metadata = {
  title: 'Top Ranking Products | EcomZone',
  description: 'Discover our top ranking products selected for quality and popularity',
};

export default function TopRankingPage() {
  return (
    <ProductsFilterClient
      pageType="top-ranking"
      title="Top Ranking Products"
      description="Discover the best products ranked by quality and customer satisfaction"
      emoji="⭐"
      gradientFrom="from-purple-500"
      gradientVia="via-indigo-500"
      gradientTo="to-blue-500"
    />
  );
}