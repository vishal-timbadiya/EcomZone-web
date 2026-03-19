"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  stock: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isTopRanking?: boolean;
}

interface ProductSectionsProps {
  currentProductId?: string;
}

export default function ProductSections({ currentProductId }: ProductSectionsProps) {
  const [topRankingProducts, setTopRankingProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newArrivalProducts, setNewArrivalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const topRankingRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const newArrivalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load wishlist
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }

    // Fetch all products
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        
        // Handle both array response and { products: [] } response
        const products = Array.isArray(data) ? data : (data.products || []);
        
        if (Array.isArray(products)) {
          const allProducts = products.filter((p: Product) => p.id !== currentProductId);
          
          // Filter by tags - if no products with tags, show all products as fallback
          const topRanking = allProducts.filter((p: Product) => p.isTopRanking);
          const trending = allProducts.filter((p: Product) => p.isBestseller);
          const newArrivals = allProducts.filter((p: Product) => p.isNewArrival);
          
          // Always show sections - use tagged products or fallback to all products
          setTopRankingProducts(topRanking.length > 0 ? topRanking.slice(0, 10) : allProducts.slice(0, 10));
          setTrendingProducts(trending.length > 0 ? trending.slice(0, 10) : allProducts.slice(0, 10));
          setNewArrivalProducts(newArrivals.length > 0 ? newArrivals.slice(0, 10) : allProducts.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentProductId]);

  const toggleWishlist = (productId: string) => {
    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    setWishlist(newWishlist);
    localStorage.setItem("wishlist", JSON.stringify(newWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const scroll = (direction: "left" | "right", ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const isInWishlist = wishlist.includes(product.id);

    return (
      <div 
        className="flex-shrink-0 w-64 md:w-72 bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Image */}
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square bg-gray-100 overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">📦</span>
              </div>
            )}
            
            {/* Labels */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isBestseller && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                  🔥 Trending
                </span>
              )}
              {product.isNewArrival && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                  ✨ New
                </span>
              )}
              {product.isTopRanking && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                  ⭐ Top
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
                isInWishlist 
                  ? "bg-pink-500 text-white" 
                  : "bg-white text-gray-400 hover:text-pink-500"
              }`}
            >
              <svg className="w-5 h-5" fill={isInWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Out of Stock */}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </Link>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">#{product.productCode || "N/A"}</p>
          
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition text-sm md:text-base">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-lg font-bold text-orange-600">₹{product.singlePrice}</span>
              <span className="text-xs text-gray-500"> / unit</span>
            </div>
            <span className="text-xs text-gray-400">CTN: {product.cartonQty} pcs</span>
          </div>
          
          <button
            disabled={product.stock === 0}
            className="w-full mt-3 bg-gray-900 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ 
    title, 
    icon, 
    link,
    onScrollLeft,
    onScrollRight 
  }: { 
    title: string; 
    icon: string;
    link: string;
    onScrollLeft: () => void;
    onScrollRight: () => void;
  }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Link 
          href={link}
          className="text-orange-600 hover:text-orange-700 font-medium text-sm md:text-base flex items-center gap-1"
        >
          View All 
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <button 
          onClick={onScrollLeft}
          className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={onScrollRight}
          className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Top Ranking Products */}
        {topRankingProducts.length > 0 && (
          <section>
            <SectionHeader
              title="Top Ranking Products"
              icon="⭐"
              link="/categories?filter=top-ranking"
              onScrollLeft={() => scroll("left", topRankingRef)}
              onScrollRight={() => scroll("right", topRankingRef)}
            />
            <div 
              ref={topRankingRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {topRankingProducts.map((product, index) => (
                <div key={product.id} className="snap-start">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <section>
            <SectionHeader
              title="Trending Products"
              icon="🔥"
              link="/categories?filter=trending"
              onScrollLeft={() => scroll("left", trendingRef)}
              onScrollRight={() => scroll("right", trendingRef)}
            />
            <div 
              ref={trendingRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {trendingProducts.map((product, index) => (
                <div key={product.id} className="snap-start">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivalProducts.length > 0 && (
          <section>
            <SectionHeader
              title="New Arrivals"
              icon="✨"
              link="/categories?filter=new-arrivals"
              onScrollLeft={() => scroll("left", newArrivalRef)}
              onScrollRight={() => scroll("right", newArrivalRef)}
            />
            <div 
              ref={newArrivalRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {newArrivalProducts.map((product, index) => (
                <div key={product.id} className="snap-start">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

