"use client";

import { useEffect, useState, useCallback } from "react";
import { getCart, saveCart, removeFromCart, CartItem } from "@/lib/cart";
import Link from "next/link";
import Image from "next/image";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductDetails {
  id: string;
  name: string;
  productCode: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(false);

  // Load cart and product details
  const loadCart = useCallback(async () => {
    if (!isOpen) return;

    const storedCart = getCart();
    setCart(storedCart);

    if (storedCart.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch product details
      const productPromises = storedCart.map(async (item) => {
        const res = await fetch(`/api/products/${item.productId}`);
        if (!res.ok) return null;
        return { id: item.productId, ...(await res.json()) };
      });

      const productsData = await Promise.all(productPromises);
      
      const productsMap: Record<string, ProductDetails> = {};
      productsData.forEach((product) => {
        if (product) {
          productsMap[product.id] = product;
        }
      });

      setProducts(productsMap);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Handle remove item
  const handleRemoveItem = (productId: string) => {
    const updatedCart = removeFromCart(productId);
    setCart(updatedCart);
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let gst = 0;

    cart.forEach((item) => {
      const product = products[item.productId];
      if (!product) return;

      const singleTotal = item.singleQty * product.singlePrice;
      const cartonTotal = item.cartonQty * product.cartonPrice;
      const itemSubtotal = singleTotal + cartonTotal;

      subtotal += itemSubtotal;
      gst += (itemSubtotal * product.gstPercentage) / 100;
    });

    return { subtotal, gst, total: subtotal + gst };
  }, [cart, products]);

  const { subtotal, gst, total } = calculateTotals();

  const MIN_ORDER_VALUE = 2500;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-orange-500 to-pink-600 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {cart.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Empty Cart */}
        {!loading && cart.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Cart Items */}
        {!loading && cart.length > 0 && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.map((item) => {
              const product = products[item.productId];
              if (!product) return null;

              const singleTotal = item.singleQty * product.singlePrice;
              const cartonTotal = item.cartonQty * product.cartonPrice;
              const itemSubtotal = singleTotal + cartonTotal;
              const itemGST = (itemSubtotal * product.gstPercentage) / 100;
              const totalUnits = item.singleQty + item.cartonQty * product.cartonQty;

              return (
                <div key={item.productId} className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">
                        #{product.productCode || "N/A"}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        {item.singleQty > 0 && (
                          <span className="bg-gray-200 px-2 py-0.5 rounded">
                            Single: {item.singleQty}
                          </span>
                        )}
                        {item.cartonQty > 0 && (
                          <span className="bg-orange-100 px-2 py-0.5 rounded text-orange-700">
                            CTN: {item.cartonQty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-orange-600">₹{(itemSubtotal + itemGST).toFixed(2)}</span>
                          <p className="text-xs text-gray-500">{totalUnits} units</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cart Summary */}
        {!loading && cart.length > 0 && (
          <div className="border-t bg-white p-5 space-y-4">
            {/* Price Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span className="text-orange-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Minimum Order Warning */}
            {total < MIN_ORDER_VALUE && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <p className="text-amber-800">
                  📦 Minimum order: ₹{MIN_ORDER_VALUE}. Add ₹{(MIN_ORDER_VALUE - total).toFixed(2)} more
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={onClose}
                className={`block w-full text-center py-4 rounded-full font-semibold transition ${
                  total < MIN_ORDER_VALUE
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block w-full text-center py-3 rounded-full font-medium border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

