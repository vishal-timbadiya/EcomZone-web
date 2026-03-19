const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'app', 'trending');

// Create directory
try {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log('✓ Directory created:', baseDir);
  
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
  
  fs.writeFileSync(path.join(baseDir, 'page.tsx'), pageContent);
  console.log('✓ Created page.tsx');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
