"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    imageUrl: string;
    slug: string;
  };
}

interface ShippingAddress {
  name?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface GstDetails {
  gstNumber?: string;
  companyName?: string;
  businessEmail?: string;
}

interface Order {
  id: string;
  orderId: string;
  subtotal: number;
  gstAmount: number;
  shippingCharge: number;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress | null;
  billingAddress?: ShippingAddress | null;
  gstDetails?: GstDetails | null;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/orders/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PACKED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "DISPATCHED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "DELIVERED":
        return "bg-green-100 text-green-700 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-500">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        #{order.orderId?.slice(-4) || "0000"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{order.orderId}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.items?.length || 0} item(s) ordered
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus}
                      </span>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium border ${getPaymentColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    {/* Product Preview */}
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {order.items && order.items.length > 0 ? (
                          order.items.slice(0, 4).map((item, idx) => (
                            <div
                              key={idx}
                              className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-white overflow-hidden shadow-sm"
                            >
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product?.name || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                  📦
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                            📦
                          </div>
                        )}
                        {order.items && order.items.length > 4 && (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-500 shadow-sm">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setSelectedOrder(selectedOrder === order.id ? null : order.id)
                          }
                          className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all hover:scale-105"
                        >
                          {selectedOrder === order.id ? "Hide Details" : "View Details"}
                        </button>
                        <a 
                          href={`/track?orderId=${order.orderId}`} 
                          className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all hover:scale-105 flex items-center gap-1 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Track
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedOrder === order.id && (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
                      <div className="grid lg:grid-cols-2 gap-8">
                        {/* Order Items */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Ordered Items
                          </h4>
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                            {order.items?.map((item) => (
                              <Link
                                href={item.product?.slug ? `/product/${item.product.slug}` : "#"}
                                key={item.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                              >
                                <div className="w-14 h-14 rounded-lg bg-white overflow-hidden shadow-sm">
                                  {item.product?.imageUrl ? (
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product?.name || "Product"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                                      📦
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {item.product?.name || "Product"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Qty: {item.quantity} × ₹{item.price?.toLocaleString("en-IN")}
                                  </p>
                                </div>
                                <p className="font-bold text-gray-900">
                                  ₹{(item.quantity * item.price).toLocaleString("en-IN")}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary & Details */}
                        <div className="space-y-6">
                          {/* Payment & Order Info */}
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Order Information
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-500 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  Payment Mode
                                </span>
                                <span className="font-semibold text-gray-900">{order.paymentMode}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-500 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Payment Status
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-500 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Order Status
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                  {order.orderStatus}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-gray-500 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Order Date
                                </span>
                                <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              Price Details
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between py-2 border-b border-gray-200">
                                <span className="text-gray-500">Subtotal ({order.items?.length || 0} items)</span>
                                <span className="font-medium">₹{order.subtotal?.toLocaleString("en-IN")}</span>
                              </div>
                              
                              {order.gstAmount > 0 ? (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                  <span className="text-gray-500 flex items-center gap-2">
                                    GST Amount
                                    {order.gstDetails && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        GST Applied
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-medium">₹{order.gstAmount?.toLocaleString("en-IN")}</span>
                                </div>
                              ) : null}
                              
                              {order.shippingCharge > 0 && (
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                  <span className="text-gray-500 flex items-center gap-2">
                                    Shipping Charges
                                  </span>
                                  <span className="font-medium">₹{order.shippingCharge?.toLocaleString("en-IN")}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between py-3 pt-4">
                                <span className="font-bold text-gray-900 text-lg">Total</span>
                                <span className="font-bold text-orange-600 text-xl">
                                  ₹{order.totalAmount?.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* GST Details (if applied) */}
                          {order.gstDetails && order.gstAmount > 0 && (
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                </svg>
                                GST Information
                              </h4>
                              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-green-600 mb-1">Company Name</p>
                                    <p className="font-medium text-gray-900">{order.gstDetails.companyName || "N/A"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-green-600 mb-1">GST Number</p>
                                    <p className="font-medium text-gray-900">{order.gstDetails.gstNumber || "N/A"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shipping Address */}
                          {order.shippingAddress && (
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Shipping Address
                              </h4>
                              <div className="bg-gray-50 rounded-xl p-4">
                                <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                                <p className="text-gray-600 mt-1">{order.shippingAddress.address}</p>
                                <p className="text-gray-600">
                                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                </p>
                                <p className="text-gray-500 mt-2">📞 {order.shippingAddress.mobile}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Invoice Button */}
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <button
                          onClick={() => router.push(`/payment-success?orderId=${order.orderId}`)}
                          className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Invoice / Download
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

