"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
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
  category: string;
  stock: number;
  createdAt?: string;
  sales?: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isTopRanking?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryPageProps {
  category: Category;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');

  const [data, setData] = useState<CategoryPageProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Filter states
  const [sortBy, setSortBy] = useState("default");
  const [filterBy, setFilterBy] = useState("default");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);
  const [stockStatus, setStockStatus] = useState("all");

  const getCart = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const cart = localStorage.getItem("cart");
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  };

  const saveCart = (cart: any[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (product: Product) => {
    const cart = getCart();
    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    
    if (existingIndex !== -1) {
      cart[existingIndex].singleQty += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        singleQty: 1,
        cartonQty: 0,
        cartonQtyPerBox: product.cartonQty,
      });
    }
    
    saveCart(cart);
  };

  const toggleWishlist = (productId: string) => {
    const index = wishlist.indexOf(productId);
    if (index !== -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(productId);
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    setWishlist([...wishlist]);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const fetchCategoryProducts = useCallback(async () => {
    if (!mounted) return;
    try {
      const url = new URL(`/api/categories/${slug}?page=${page}&limit=24`, window.location.origin);
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, page, mounted]);

  useEffect(() => {
    setMounted(true);
    try {
      const savedWishlist = localStorage.getItem("wishlist");
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    } catch {
      setWishlist([]);
    }
    fetchCategoryProducts();
  }, [fetchCategoryProducts]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    
    let result = [...data.products];

    // Stock status filter
    if (stockStatus === 'in-stock') {
      result = result.filter(p => p.stock > 0);
    } else if (stockStatus === 'out-of-stock') {
      result = result.filter(p => p.stock === 0);
    }

    // Price range filter
    result = result.filter(p => p.singlePrice >= minPrice && p.singlePrice <= maxPrice);

    // Sort
    if (sortBy === 'low-high') {
      result = [...result].sort((a, b) => a.singlePrice - b.singlePrice);
    } else if (sortBy === 'high-low') {
      result = [...result].sort((a, b) => b.singlePrice - a.singlePrice);
    }

    // Filter by type
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
  }, [data, stockStatus, minPrice, maxPrice, sortBy, filterBy]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-xl w-64 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-xl mx-auto mb-4"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <span className="text-6xl mb-6">📦</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No products in this category</h2>
            <Link href="/categories" className="text-orange-600 hover:text-orange-700 font-medium">
              ← Browse all categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { category, products } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-gray-500 hover:text-orange-600">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/categories" className="text-gray-500 hover:text-orange-600">Categories</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{category.name}</li>
          </ol>
        </div>
      </nav>

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
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Min</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-xs text-gray-600">-</span>
                    <label className="text-xs text-gray-600">Max</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Math.max(minPrice, parseInt(e.target.value) || 99999))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="99999"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <div className="text-xs text-gray-600 text-center">
                    ₹{minPrice} - ₹{maxPrice}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
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
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={() => addToCart(product)}
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

