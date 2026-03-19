"use client";

import { useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  category: string;
}

interface TopRankingSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
}

export default function TopRankingSection({ 
  products, 
  onAddToCart, 
  onToggleWishlist,
  wishlist 
}: TopRankingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Sort by price low to high for top ranking
  const topRankingProducts = [...products]
    .sort((a, b) => a.singlePrice - b.singlePrice)
    .slice(0, 10);

  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Top Ranking Products
          </h2>
          <div >
            <Link href="/top-ranking" className="text-orange-600 hover:text-orange-700 font-medium text-xs sm:text-sm">
              View All →
            </Link>
          </div>
          {/* <div className="flex gap-2">
            <button 
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              ←
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              →
            </button>
          </div> */}
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 sm:pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {topRankingProducts.map((product, index) => (
            <div key={product.id} className="flex-shrink-0 w-40 sm:w-48 md:w-56">
              <ProductCard 
                product={product} 
                index={index}
                wishlist={wishlist}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={() => onAddToCart(product)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

