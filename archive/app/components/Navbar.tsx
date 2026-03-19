"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { getCartCount } from "@/lib/cart";

// Initialize state from localStorage to avoid setState in useEffect
const getInitialCartCount = (): number => {
  if (typeof window === "undefined") return 0;
  return getCartCount();
};

const getInitialLoginStatus = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
};

const getInitialWishlistCount = (): number => {
  if (typeof window === "undefined") return 0;
  try {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist).length : 0;
  } catch {
    return 0;
  }
};

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(getInitialCartCount);
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialLoginStatus);
  const [wishlistCount, setWishlistCount] = useState(getInitialWishlistCount);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're in admin panel - don't show Navbar/Footer for admin routes
  const isAdminRoute = useMemo(() => {
    return pathname?.startsWith("/admin");
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    // Listen for cart updates
    const handleCartUpdate = () => {
      setCartCount(getCartCount());
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      setWishlistCount(getInitialWishlistCount());
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [isAdminRoute]);

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Don't render Navbar on admin pages
  if (isAdminRoute) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-lg" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        {/* Main Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2 sm:gap-3 md:gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="EcomZone" 
                className="w-32 sm:w-44 md:w-60 h-10 sm:h-12 md:h-14 object-contain"
              />
            </Link>

          {/* Search Bar - Center */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 md:h-5 w-4 md:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search products by name or code..."
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white/20 transition-all"
                  suppressHydrationWarning
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center">
                    <div className="animate-spin h-4 md:h-5 w-4 md:w-5 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 p-2 md:p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 md:w-12 h-10 md:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">Code: #{product.productCode}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs md:text-sm font-semibold text-orange-600">₹{product.singlePrice}</p>
                      <p className="text-xs text-gray-400">per unit</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1 md:gap-2 ml-auto">
            
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 rounded-lg hover:bg-white/10 transition relative flex-shrink-0"
            >
              <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden md:block text-xs mt-0.5">Wishlist</span>
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-pink-500 text-white text-xs w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center rounded-full font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Login/Signup or Profile */}
{mounted && isLoggedIn ? (
              <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 rounded-lg hover:bg-white/10 transition relative group cursor-pointer flex-shrink-0" onClick={(e) => e.preventDefault()}>
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden md:block text-xs mt-0.5">Profile</span>
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-40 md:w-48 bg-white rounded-xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <Link href="/profile" className="block px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 text-gray-900 text-sm md:text-base font-medium border-b">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </div>
                  </Link>
                  <Link href="/my-orders" className="block px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 text-gray-900 text-sm md:text-base font-medium">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      My Orders
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 text-red-600 text-sm md:text-base font-medium">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 rounded-lg hover:bg-white/10 transition relative group cursor-pointer flex-shrink-0" onClick={(e) => e.preventDefault()}>
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:block text-xs mt-0.5">Account</span>
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-40 md:w-48 bg-white rounded-xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <Link href="/login" className="block px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 text-gray-900 text-sm md:text-base font-medium border-b">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Login
                    </div>
                  </Link>
                  <Link href="/signup" className="block px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 text-gray-900 text-sm md:text-base font-medium">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3.868 11.362A3 3 0 004 12v1a5.455 5.455 0 01.668 2.364M11.342 15.455A5.455 5.455 0 0112 17v1a5.455 5.455 0 01-.668 2.364M11.342 15.455L9.73 20.094A4 4 0 0112 21a4 4 0 002.27-.77l1.612 4.639" />
                      </svg>
                      Signup
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 rounded-lg hover:bg-white/10 transition relative flex-shrink-0"
            >
              <div className="relative">
                <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 sm:w-5 h-4 sm:h-5 flex items-center justify-center rounded-full font-medium">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-xs mt-0.5">Cart</span>
            </Link>
          </div>
        </div>
      </div>

    </header>
  );
}


