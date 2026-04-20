"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-lg text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <button onClick={() => router.push("/")} className="bg-green-500 text-white px-6 py-2 rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
            <p className="text-gray-600">Thank you for your order. We will process it soon.</p>
            <p className="text-sm text-gray-500">Order ID: <span className="font-mono font-medium">{order.orderId}</span></p>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h2 className="font-semibold text-lg text-gray-900">Order Summary</h2>
            
            {order.items && order.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{item.product?.name || "Product"}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">Rs{item.price}</p>
              </div>
            ))}

            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs{order.subtotal?.toFixed(2) || "0.00"}</span>
              </div>
              
              {order.gstAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>GST</span>
                  <span>Rs{order.gstAmount?.toFixed(2) || "0.00"}</span>
                </div>
              )}
              
              {order.shippingCharge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Rs{order.shippingCharge?.toFixed(2) || "0.00"}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">Rs{order.totalAmount?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Payment Mode</span><span className="font-medium">{order.paymentMode}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Order Status</span><span className="font-medium text-green-600">{order.orderStatus}</span></div>
            {order.shippingAddress && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-700 mb-2">Shipping Address:</p>
                <p className="text-sm text-gray-600">{order.shippingAddress.name}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p className="text-sm text-gray-600">Mobile: {order.shippingAddress.mobile}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button onClick={() => router.push("/my-orders")} className="bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all">
              View My Orders
            </button>
            <button onClick={() => router.push("/")} className="border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

