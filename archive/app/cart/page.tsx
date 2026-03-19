"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCart, removeFromCart, CartItem } from "@/lib/cart";

interface ProductDetails {
  id: string;
  name: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  category?: string;
}

const MIN_ORDER_VALUE = 2500;

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load cart
  const loadCart = useCallback(async () => {
    const storedCart = getCart();
    setCart(storedCart);

    if (storedCart.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch product details in parallel
    try {
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
  }, []);

  useEffect(() => {
    setMounted(true);
    loadCart();
  }, [loadCart]);

  // Handle remove item
  const handleRemoveItem = (productId: string) => {
    const updatedCart = removeFromCart(productId);
    setCart(updatedCart);
  };

  // Handle quantity update
  const handleUpdateQuantity = (productId: string, type: 'single' | 'carton', increment: boolean) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const product = products[productId];
    if (!product) return;

    const newCart = [...cart];
    const itemIndex = newCart.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return;

    const newItem = newCart[itemIndex] = { ...item };
    
    if (type === 'single') {
      newItem.singleQty = increment ? item.singleQty + 1 : Math.max(0, item.singleQty - 1);
      if (newItem.singleQty === 0 && newItem.cartonQty === 0) {
        newCart.splice(itemIndex, 1);
      }
    } else {
      newItem.cartonQty = increment ? item.cartonQty + 1 : Math.max(0, item.cartonQty - 1);
      if (newItem.cartonQty === 0 && newItem.singleQty === 0) {
        newCart.splice(itemIndex, 1);
      }
    }


    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
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

    return { subtotal, gst, total: subtotal };
  }, [cart, products]);

  const { subtotal, gst, total } = calculateTotals();

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md w-full">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 md:py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cart.map((item) => {
              const product = products[item.productId];

              if (!product) {
                return (
                  <div
                    key={item.productId}
                    className="bg-white rounded-2xl shadow-md p-3 sm:p-4 md:p-6 animate-pulse"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                );
              }

              const totalQty = item.singleQty + item.cartonQty * product.cartonQty;
              const singleTotal = item.singleQty * product.singlePrice;
              const cartonTotal = item.cartonQty * product.cartonPrice;
              const itemSubtotal = singleTotal + cartonTotal;
              const itemGST = (itemSubtotal * product.gstPercentage) / 100;
              const isOutOfStock = product.stock < totalQty;

              return (
                <div
                  key={item.productId}
                  className={`bg-white rounded-2xl shadow-md overflow-hidden ${isOutOfStock ? 'ring-2 ring-red-500' : ''}`}
                >
                  <div className="p-3 sm:p-4 md:p-6 flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-6">
                    {/* Product Image */}
                    <div className="w-full md:w-20 md:h-20 lg:w-28 lg:h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 h-24 sm:h-28">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 sm:w-10 h-8 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Category: {product.category}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 sm:p-2 flex-shrink-0"
                        >
                          <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Pricing Details */}
                      <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                        {item.singleQty > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">Single: {item.singleQty} × ₹{product.singlePrice}</span>
                            <span className="font-medium">₹{singleTotal.toFixed(2)}</span>
                          </div>
                        )}
                        {item.cartonQty > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Carton: {item.cartonQty} × ₹{product.cartonPrice}</span>
                            <span className="font-medium">₹{cartonTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, 'single', false)}
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                          >
                            -
                          </button>
                          <span className="px-4 font-medium">{item.singleQty} unit{item.singleQty !== 1 ? 's' : ''}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, 'single', true)}
                            className="px-3 py-2 text-gray-600 hover:text-gray-900"
                          >
                            +
                          </button>
                        </div>

                        {product.cartonQty > 0 && (
                          <div className="flex items-center bg-gray-100 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, 'carton', false)}
                              className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            >
                              -
                            </button>
                            <span className="px-4 font-medium">{item.cartonQty} carton{item.cartonQty !== 1 ? 's' : ''}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, 'carton', true)}
                              className="px-3 py-2 text-gray-600 hover:text-gray-900"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="ml-auto">
                          <span className="text-lg font-bold text-gray-900">₹{itemSubtotal.toFixed(2)}</span>
                          <span className="text-sm text-gray-500 ml-2">+ ₹{itemGST.toFixed(2)} GST</span>
                        </div>
                      </div>

                      {isOutOfStock && (
                        <p className="mt-2 text-red-500 text-sm font-medium">⚠️ Out of stock</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (Excluded)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {total < MIN_ORDER_VALUE && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-orange-700 text-sm">
                    Minimum order value is ₹{MIN_ORDER_VALUE}. 
                    Add ₹{(MIN_ORDER_VALUE - total).toFixed(2)} more to proceed.
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={() => router.push("/checkout")}
                disabled={total < MIN_ORDER_VALUE}
                className={`mt-6 w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold transition-all duration-300 ${
                  total < MIN_ORDER_VALUE
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                {total < MIN_ORDER_VALUE ? `Minimum ₹${MIN_ORDER_VALUE} Required` : "Proceed to Checkout"}
              </button>

              <button
                onClick={() => router.push("/")}
                className="mt-3 w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

