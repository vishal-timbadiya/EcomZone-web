const fs = require('fs');
const path = require('path');

const trendingDir = path.join(__dirname, 'app', 'trending');
const componentSource = path.join(__dirname, 'app', 'components', 'TrendingClient.tsx');
const componentDest = path.join(trendingDir, 'TrendingClient.tsx');

try {
  // Create trending directory
  fs.mkdirSync(trendingDir, { recursive: true });
  console.log('✓ Created directory:', trendingDir);

  // Create page.tsx
  const pageContent = `import { Metadata } from "next";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: "Trending Products - Top Bestsellers | EcomZone",
  description: "Discover the hottest trending products at EcomZone. Shop bestsellers, new arrivals, and top-ranked items.",
};

export default function TrendingPage() {
  return <TrendingClient />;
}
`;
  
  fs.writeFileSync(path.join(trendingDir, 'page.tsx'), pageContent);
  console.log('✓ Created page.tsx');

  // Copy TrendingClient.tsx to trending directory
  if (fs.existsSync(componentSource)) {
    const content = fs.readFileSync(componentSource, 'utf-8');
    fs.writeFileSync(componentDest, content);
    console.log('✓ Created TrendingClient.tsx in trending directory');
  } else {
    console.warn('⚠ Warning: TrendingClient.tsx not found at', componentSource);
  }

  console.log('\n✓ Trending page structure created successfully!');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
