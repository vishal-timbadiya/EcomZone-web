
"use client";

import { useState, useEffect } from "react";

// Components
import HeroSection from "./components/HeroSection";
import CategorySection from "./components/CategorySection";
import PriceFilterSection from "./components/PriceFilterSection";
import TopRankingSection from "./components/TopRankingSection";
import TrendingSection from "./components/TrendingSection";
import VideoReelsSection from "./components/VideoReelsSection";
import StatsSection from "./components/StatsSection";
import NewArrivalsSection from "./components/NewArrivalsSection";
import TrustBadgesSection from "./components/TrustBadgesSection";
import NewsletterSection from "./components/NewsletterSection";

// Types
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
  isBestseller?: boolean;
  isNewArrival?: boolean;
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Fetch products from API only (no sample products)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const productsData = Array.isArray(data) ? data : [];
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Initialize wishlist
    setWishlist(getWishlist());
  }, []);

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {/* <HeroSection /> */}

      {/* Categories Section */}
      <CategorySection />

      {/* Find Your Price Section */}
      {loading ? (
        <div className="py-6 sm:py-8 md:py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <PriceFilterSection />
      )}

      {/* Top Ranking Products */}
      {!loading && products.length > 0 && (
        <TopRankingSection 
          products={products}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
        />
      )}

      {/* Trending Products */}
      {!loading && products.length > 0 && (
        <TrendingSection 
          products={products}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
        />
      )}

      {/* Video Reels Section */}
      {/* <VideoReelsSection /> */}

      {/* Stats Section */}
      <StatsSection />

      {/* New Arrivals */}
      {!loading && products.length > 0 && (
        <NewArrivalsSection 
          products={products}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
        />
      )}

      {/* Trust Badges */}
      <TrustBadgesSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl z-50 animate-bounce text-xs sm:text-sm md:text-base">
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
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}


