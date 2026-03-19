"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]");
    
    if (wishlistIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const products = await res.json();
          const filteredProducts = products.filter((p: any) => wishlistIds.includes(p.id));
          setWishlistItems(filteredProducts);
        }
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const removeFromWishlist = (productId: string) => {
    const wishlistIds = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const updated = wishlistIds.filter((id: string) => id !== productId);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setWishlistItems(wishlistItems.filter(item => item.id !== productId));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
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
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
          <div className="text-center py-16 bg-white rounded-2xl">
            <svg className="w-16 h-16 mx-auto mb-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Add items to your wishlist to see them here</p>
            <Link href="/" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-full font-medium hover:bg-orange-600 transition">
              Continue Shopping
            </Link>
          </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
              <Link href={`/product/${product.slug}`}>
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">#{product.productCode}</p>
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition">{product.name}</h3>
                </Link>
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold text-orange-600">Rs{product.singlePrice}</span>
                    <span className="text-xs text-gray-500"> / unit</span>
                  </div>
                <div className="flex gap-2">
                  <button onClick={() => addToCart(product)} className="flex-1 bg-gray-900 hover:bg-orange-500 text-white py-2 rounded-lg font-medium transition">
                    Add to Cart
                  </button>
                  <button onClick={() => removeFromWishlist(product.id)} className="px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition">
                    X
                  </button>
                </div>
            </div>
            </div>
          </div>
          ))}
        </div>
    </div>
    </div>
  );
}
