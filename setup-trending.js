const fs = require('fs');
const path = require('path');

const trendingDir = path.join(__dirname, 'app', 'trending');

// Create directory
fs.mkdirSync(trendingDir, { recursive: true });

// Create page.tsx
const pageContent = `import { Metadata } from "next";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: "Trending Products - Top Bestsellers | EcomZone",
  description: "Discover the hottest trending products at EcomZone. Shop bestsellers, new arrivals, and top-ranked items.",
};

export default function TrendingPage() {
  return <TrendingClient />;
}`;

fs.writeFileSync(path.join(trendingDir, 'page.tsx'), pageContent);

console.log('✓ Created directory:', trendingDir);
console.log('✓ Created file:', path.join(trendingDir, 'page.tsx'));
