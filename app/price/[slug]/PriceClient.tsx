"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '@/app/components/ProductCard';

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
  createdAt?: string;
  sales?: number;
}

const PRICE_RANGES = [
  { label: "Under ₹9", min: 0, max: 9, slug: "under-9" },
  { label: "Under ₹49", min: 0, max: 49, slug: "under-49" },
  { label: "Under ₹99", min: 0, max: 99, slug: "under-99" },
  { label: "Under ₹149", min: 0, max: 149, slug: "under-149" },
  { label: "Under ₹249", min: 0, max: 249, slug: "under-249" },
  { label: "Under ₹499", min: 0, max: 499, slug: "under-499" },
  { label: "₹499+", min: 0, max: 99999, slug: "499-plus" },
];

interface Props {
  slug: string;
}

export default function PriceClient({ slug }: Props) {
  const router = useRouter();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter states
  const [sortBy, setSortBy] = useState("default");
  const [filterBy, setFilterBy] = useState("default");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);

  const priceRange = PRICE_RANGES.find(r => r.slug === slug);
  const currentRangeIndex = PRICE_RANGES.findIndex(r => r.slug === slug);
  const nextPriceRange = currentRangeIndex < PRICE_RANGES.length - 1 ? PRICE_RANGES[currentRangeIndex + 1] : null;
  const prevPriceRange = currentRangeIndex > 0 ? PRICE_RANGES[currentRangeIndex - 1] : null;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/products`);
        if (res.ok) {
          const products = await res.json();
          if (priceRange) {
            const filtered = products.filter((p: Product) =>
              p.singlePrice >= priceRange.min && p.singlePrice < priceRange.max
            );
            setAllProducts(filtered);
            
            const uniqueCategories = [...new Set(filtered.map((p: Product) => p.category))].filter(Boolean) as string[];
            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (priceRange) {
      fetchProducts();
      try {
        const saved = localStorage.getItem('wishlist');
        if (saved) setWishlist(JSON.parse(saved));
      } catch {
        setWishlist([]);
      }
    }
  }, [slug, priceRange]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (stockStatus === 'in-stock') {
      result = result.filter(p => p.stock > 0);
    } else if (stockStatus === 'out-of-stock') {
      result = result.filter(p => p.stock === 0);
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    if (sortBy === 'low-high') {
      result = [...result].sort((a, b) => a.singlePrice - b.singlePrice);
    } else if (sortBy === 'high-low') {
      result = [...result].sort((a, b) => b.singlePrice - a.singlePrice);
    }

    if (filterBy === 'bestselling') {
      result = [...result].sort((a, b) => (b.sales || 0) - (a.sales || 0));
    } else if (filterBy === 'new-arrival') {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } else if (filterBy === 'top-ranking') {
      result = [...result].sort((a, b) => (b.sales || 0) - (a.sales || 0));
    }

    return result;
  }, [allProducts, stockStatus, selectedCategories, sortBy, filterBy]);

  const handleAddToCart = (product: Product) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existing = cart.find((item: any) => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleToggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleToggleWishlist = (productId: string) => {
    try {
      const updated = wishlist.includes(productId)
        ? wishlist.filter(id => id !== productId)
        : [...wishlist, productId];
      setWishlist(updated);
      localStorage.setItem('wishlist', JSON.stringify(updated));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  if (!priceRange) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Price Range Not Found</h1>
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-gray-500 hover:text-orange-600">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{priceRange.label}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stock Status Tabs */}
        <div className="flex gap-3 mb-6 sticky top-0 bg-gray-50 py-4 z-40">
          <button
            onClick={() => setStockStatus('all')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              stockStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setStockStatus('in-stock')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              stockStatus === 'in-stock'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setStockStatus('out-of-stock')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              stockStatus === 'out-of-stock'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Out Of Stock
          </button>
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Filter By</h3>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="default">Default</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
              </div>

              {/* Filter By */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter By</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="default">Default</option>
                  <option value="bestselling">Bestselling</option>
                  <option value="new-arrival">New Arrival</option>
                  <option value="top-ranking">Top Ranking</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Price Range</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 bg-blue-50 p-3 rounded-lg">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-gray-900">₹{priceRange?.min}</div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-gray-900">{priceRange?.max === 99999 ? '∞' : '₹' + priceRange?.max}</div>
                      <div className="text-xs text-gray-600">Max</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-between">
                    {prevPriceRange && (
                      <button
                        onClick={() => router.push(`/price/${prevPriceRange.slug}`)}
                        className="flex-1 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold transition text-sm"
                        title={`Previous: ${prevPriceRange.label}`}
                      >
                        ← Prev
                      </button>
                    )}
                    {!prevPriceRange && <div className="flex-1"></div>}
                    
                    {nextPriceRange && (
                      <button
                        onClick={() => router.push(`/price/${nextPriceRange.slug}`)}
                        className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition text-sm"
                        title={`Next: ${nextPriceRange.label}`}
                      >
                        Next →
                      </button>
                    )}
                    {!nextPriceRange && <div className="flex-1"></div>}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Categories</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={() => setSelectedCategories([])}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-gray-700">All Products</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleToggleCategoryFilter(category)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSortBy('default');
                    setFilterBy('default');
                    setMinPrice(0);
                    setMaxPrice(99999);
                    setSelectedCategories([]);
                    setStockStatus('all');
                  }}
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      wishlist={wishlist}
                      onToggleWishlist={handleToggleWishlist}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
