"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  category: string;
  categories: string[];
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Props {
  slug: string;
}

// Cart functions
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

const addToCart = (product: Product, singleQty: number = 1, cartonQty: number = 0) => {
  const cart = getCart();
  const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
  
  if (existingIndex !== -1) {
    cart[existingIndex].singleQty += singleQty;
    cart[existingIndex].cartonQty += cartonQty;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      singleQty,
      cartonQty,
      cartonQtyPerBox: product.cartonQty,
    });
  }
  
  saveCart(cart);
};

// Wishlist functions
const getWishlist = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist) : [];
  } catch {
    return [];
  }
};

const toggleWishlist = (productId: string) => {
  const wishlist = getWishlist();
  const index = wishlist.indexOf(productId);
  
  if (index !== -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(productId);
  }
  
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  window.dispatchEvent(new Event("wishlistUpdated"));
};

export default function CategoryClient({ slug }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high" | "newest">("newest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats);
          
          // Find current category
          const currentCat = cats.find((c: Category) => c.slug === slug);
          if (currentCat) {
            setCategory(currentCat);
          }
        }

        // Fetch products - filter by category slug in the categories array
        const res = await fetch(`/api/products?categories=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setWishlist(getWishlist());
  }, [slug]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, 0);
    showToast("Added to cart!");
  };

  const handleToggleWishlist = (productId: string) => {
    toggleWishlist(productId);
    setWishlist(getWishlist());
    const isInWishlist = wishlist.includes(productId);
    showToast(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const getSortedProducts = () => {
    const sorted = [...products];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price-low":
        return sorted.sort((a, b) => a.singlePrice - b.singlePrice);
      case "price-high":
        return sorted.sort((a, b) => b.singlePrice - a.singlePrice);
      case "newest":
      default:
        return sorted;
    }
  };

  const sortedProducts = getSortedProducts();

  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-orange-600">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">{categoryName}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Categories</h3>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className={`block px-3 py-2 rounded-lg transition-colors ${
                        cat.slug === slug
                          ? "bg-orange-100 text-orange-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Category Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-3xl">
                  {category?.icon || "📦"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
                  <p className="text-gray-500">{products.length} products</p>
                </div>
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Showing {sortedProducts.length} products
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-gray-600 text-sm">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="name">Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500">
                  We couldn't find any products in this category.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Browse All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <Link href={`/product/${product.slug}`}>
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">📦</span>
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Out of Stock
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleWishlist(product.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {wishlist.includes(product.id) ? (
                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/product/${product.slug}`}>
                        <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{product.productCode}</p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{product.singlePrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          +{product.gstPercentage}% GST
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="mt-3 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
          {toast.message}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
        .fade-up {
          animation: fadeUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

