"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isTopRanking?: boolean;
}

interface ProductsFilterClientProps {
  pageType: 'top-ranking' | 'trending' | 'new-arrivals';
  title: string;
  description: string;
  emoji: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

export default function ProductsFilterClient({
  pageType,
  title,
  description,
  emoji,
  gradientFrom,
  gradientVia,
  gradientTo,
}: ProductsFilterClientProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter states
  const [sortBy, setSortBy] = useState("default");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState("all");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products?type=${pageType}`);
        if (res.ok) {
          const products = await res.json();
          setAllProducts(products);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(products.map((p: Product) => p.category))].filter(Boolean) as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) setWishlist(JSON.parse(saved));
    } catch {
      setWishlist([]);
    }
  }, [pageType]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    // Price range filter
    result = result.filter(p => 
      p.singlePrice >= minPrice && p.singlePrice <= maxPrice
    );

    // Stock status filter
    if (stockStatus === 'in-stock') {
      result = result.filter(p => p.stock > 0);
    } else if (stockStatus === 'out-of-stock') {
      result = result.filter(p => p.stock === 0);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Sort
    if (sortBy === 'low-high') {
      result = [...result].sort((a, b) => a.singlePrice - b.singlePrice);
    } else if (sortBy === 'high-low') {
      result = [...result].sort((a, b) => b.singlePrice - a.singlePrice);
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
    }

    return result;
  }, [allProducts, stockStatus, selectedCategories, sortBy, minPrice, maxPrice]);

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

  const handleResetFilters = () => {
    setSortBy('default');
    setMinPrice(0);
    setMaxPrice(99999);
    setSelectedCategories([]);
    setStockStatus('all');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-3">
          <nav className="text-xs sm:text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="text-gray-500 hover:text-orange-600">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} text-white py-4 sm:py-6 md:py-8 mb-4 sm:mb-6 md:mb-8`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2">
            {emoji} {title} {emoji}
          </h1>
          <p className="text-xs sm:text-base md:text-lg opacity-90">{description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-8">
        {/* Stock Status Tabs */}
        <div className="flex gap-2 sm:gap-3 mb-4 md:mb-6 sticky top-0 bg-gray-50 py-3 md:py-4 z-40 flex-wrap">
          <button
            onClick={() => setStockStatus('all')}
            className={`px-3 sm:px-4 md:px-6 py-1 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition ${
              stockStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setStockStatus('in-stock')}
            className={`px-3 sm:px-4 md:px-6 py-1 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition ${
              stockStatus === 'in-stock'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setStockStatus('out-of-stock')}
            className={`px-3 sm:px-4 md:px-6 py-1 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition ${
              stockStatus === 'out-of-stock'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Out Of Stock
          </button>
        </div>

        <div className="flex gap-4 md:gap-8 flex-col md:flex-row">
          {/* Left Sidebar - Filters */}
          <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 md:p-6 sticky top-24 md:top-20">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Filter By</h3>

              {/* Sort By */}
              <div className="mb-4 md:mb-6">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="default">Default</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Price Range</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                      placeholder="Min price"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
                      placeholder="Max price"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-blue-50 p-3 rounded-lg">
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-gray-900">₹{minPrice}</div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="text-center flex-1">
                      <div className="text-lg font-bold text-gray-900">₹{maxPrice}</div>
                      <div className="text-xs text-gray-600">Max</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
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

              {/* Reset Filters */}
              <button
                onClick={handleResetFilters}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 sm:p-4 animate-pulse">
                    <div className="w-full h-32 sm:h-40 bg-gray-200 rounded-lg mb-2 sm:mb-3"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 md:p-12 text-center">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📦</div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Try adjusting your filters</p>
                <button
                  onClick={handleResetFilters}
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-xs sm:text-sm text-gray-600">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
