const fs = require('fs');
const path = require('path');

const pages = [
  {
    path: 'd:\\ecomzone_V2\\app\\top-ranking',
    file: 'page.tsx',
    content: `import ProductsFilterClient from '@/app/components/ProductsFilterClient';

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
}`
  },
  {
    path: 'd:\\ecomzone_V2\\app\\trending',
    file: 'page.tsx',
    content: `import ProductsFilterClient from '@/app/components/ProductsFilterClient';

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
}`
  },
  {
    path: 'd:\\ecomzone_V2\\app\\new-arrivals',
    file: 'page.tsx',
    content: `import ProductsFilterClient from '@/app/components/ProductsFilterClient';

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
}`
  }
];

pages.forEach(({ path: dir, file, content }) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
  const filePath = path.join(dir, file);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created file: ${filePath}`);
});

console.log('✅ All pages created successfully!');

