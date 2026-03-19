const fs = require('fs');
const path = require('path');

// Create the trending directory and files
const trendingDir = 'd:/ecomzone_V2/app/trending';

try {
  // Create directory recursively
  fs.mkdirSync(trendingDir, { recursive: true });
  console.log('Directory created:', trendingDir);

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
  console.log('File created: page.tsx');

  console.log('✓ Directory structure created successfully!');
  console.log('✓ Ready for TrendingClient.tsx');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
