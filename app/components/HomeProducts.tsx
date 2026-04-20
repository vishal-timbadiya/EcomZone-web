"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function getAbsoluteImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const backendUrl = apiUrl.replace(/\/api$/, '');
  return `${backendUrl}${url}`;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  imageUrl: string;
  singlePrice: number;
  cartonQty: number;
}

const PRICE_TABS = ["Under 9 Rs", "Under 49 Rs", "Under 99 Rs", "Under 149 Rs", "Under 249 Rs", "Under 499 Rs"];

export default function HomeProducts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrice, setSelectedPrice] = useState(-1);

  useEffect(() => {
    fetch(`${apiUrl}/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getFilteredProducts = () => {
    if (selectedPrice === -1) return products;
    const ranges = [
      { min: 0, max: 9 },
      { min: 9, max: 49 },
      { min: 49, max: 99 },
      { min: 99, max: 149 },
      { min: 149, max: 249 },
      { min: 249, max: 499 },
    ];
    const range = ranges[selectedPrice];
    return products.filter(p => p.singlePrice >= range.min && p.singlePrice < range.max);
  };

  const filtered = getFilteredProducts();

  return (
    <>
      <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Top Ranking Products</h2>
          {loading ? (
            <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto">
              {[1,2,3,4,5].map(i => <div key={i} className="flex-shrink-0 w-40 sm:w-56 md:w-64 bg-gray-200 h-60 sm:h-80 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-2 sm:pb-4">
              {products.slice(0, 10).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Trending Products</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[1,2,3,4].map(i => <div key={i} className="bg-gray-200 h-60 sm:h-80 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.slice(0, 4).map(product => (
                <TrendingCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">New Arrivals</h2>
          {loading ? (
            <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto">
              {[1,2,3,4,5].map(i => <div key={i} className="flex-shrink-0 w-40 sm:w-56 md:w-64 bg-gray-200 h-60 sm:h-80 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-2 sm:pb-4">
              {products.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} isNew />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProductCard({ product, isNew }: { product: Product; isNew?: boolean }) {
  return (
    <Link href={`/product/${product.slug}`} className="flex-shrink-0 w-64">
      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
        <div className="aspect-square bg-gray-100 relative">
          {product.imageUrl ? (
            <img src={getAbsoluteImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">📦</div>
          )}
          {isNew && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">#{product.productCode || "N/A"}</p>
          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-orange-600">₹{product.singlePrice}</span>
            <span className="text-xs text-gray-400">CTN: {product.cartonQty}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TrendingCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`}>
      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          {product.imageUrl ? (
            <img src={getAbsoluteImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">📦</div>
          )}
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">Best Seller</div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">#{product.productCode || "N/A"}</p>
          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-orange-600">₹{product.singlePrice}</span>
            <span className="text-xs text-gray-400">CTN: {product.cartonQty}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

