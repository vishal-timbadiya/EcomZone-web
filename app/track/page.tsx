"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TrackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id) {
      setOrderId(id);
      // Call handleTrack with the id directly instead of using state
      handleTrackWithId(id);
    }
  }, [searchParams]); 

  const handleTrackWithId = async (id: string) => {
    if (!id.trim()) {
      setError("Please enter order ID");
      return;
    }
    
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/orders/${id.trim()}`);
      const data = await res.json();
      
      if (res.ok && data) {
        setOrder(data);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      setError("Error tracking order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    handleTrackWithId(orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DELIVERED": return "bg-emerald-500";
      case "DISPATCHED": return "bg-orange-500";
      case "CONFIRMED": return "bg-blue-500";
      case "PACKED": return "bg-yellow-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-8 py-5 bg-white rounded-3xl shadow-2xl mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                Track Order
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Enter your order ID to check delivery status instantly
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Enter Order ID (e.g., ORD-12345)"
                className="w-full pl-12 pr-4 py-5 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all text-lg shadow-inner"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                suppressHydrationWarning
              />
            </div>
            <button
              onClick={handleTrack}
              disabled={loading}
              className="lg:w-auto w-full px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              suppressHydrationWarning
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Track Order
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-1">Order #{order.orderId}</h2>
                  <div className="flex items-center gap-4 text-emerald-100">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="text-sm opacity-90">
                      Total: ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm opacity-90">Placed on</span>
                  <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="p-8">
              <h3 className="text-xl font-bold mb-8 text-gray-900">Delivery Progress</h3>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Order Confirmed</span>
                <span className="text-sm font-medium text-gray-500">Packed</span>
                <span className="text-sm font-medium text-gray-500">Dispatched</span>
                <span className="text-sm font-medium text-gray-500">Delivered</span>
              </div>

              <div className="flex items-center justify-between">
{['CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED'].map((step, index) => {
                  const currentStatus = order.orderStatus?.toUpperCase();
                  const isActive = currentStatus === step;
                  const isCompleted = currentStatus === 'DELIVERED' || 
                    (index === 0 && currentStatus === 'CONFIRMED') ||
                    (currentStatus === 'PACKED' && index === 0) ||
                    (currentStatus === 'DISPATCHED' && (index === 0 || index === 1));
                  
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 relative">
                      {/* Step line */}
                      {index < 3 && (
                        <div className={`absolute top-6 left-8 w-full h-1 ${isCompleted || isActive ? 'bg-emerald-400' : 'bg-gray-200'}`} style={{zIndex: 1}}></div>
                      )}
                      
                      {/* Step circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all relative z-10 ${
                        isCompleted ? 'bg-emerald-500 text-white shadow-emerald-400/50' :
                        isActive ? 'bg-blue-500 text-white shadow-blue-400/50 scale-110' :
                        'bg-gray-200 text-gray-500 shadow-gray-200/50'
                      }`}>
                        {isCompleted ? '✓' : (isActive ? '●' : index + 1)}
                      </div>
                      
                      <span className={`text-xs mt-2 font-medium ${
                        isCompleted ? 'text-emerald-600 font-bold' : 
                        isActive ? 'text-blue-600 font-bold' : 'text-gray-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="p-8 bg-gray-50">
              <h3 className="text-xl font-bold mb-6 text-gray-900">Order Details</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {order.courierName && (
                  <div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Courier</h4>
                      <p className="text-lg font-bold text-blue-600">{order.courierName}</p>
                      {order.trackingId && (
                        <a href={`https://www.17track.net/en#nums=${order.trackingId}`} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-flex items-center gap-1">
                          Track Live <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-6 bg-white rounded-2xl shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Payment Status</h4>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${
                    order.paymentStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 
                    order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      order.paymentStatus === 'SUCCESS' ? 'bg-emerald-500' : 
                      order.paymentStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    {order.paymentStatus || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders Suggestion */}
        {!order && !error && (
          <div className="text-center mt-12 p-12 bg-white rounded-3xl shadow-2xl border-4 border-dashed border-gray-200">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No order to track</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Enter your order ID above or check your email/WhatsApp for the latest tracking updates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/my-orders" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:shadow-xl transition-all">
                View My Orders
              </a>
              <a href="/contact" className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-2xl">Loading...</div></div>}>
      <TrackPageContent />
    </Suspense>
  );
}

