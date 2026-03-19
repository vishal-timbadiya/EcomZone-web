"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          🎉 Order Placed Successfully!
        </h1>

        <p className="mb-2">Your Order ID:</p>

        <p className="font-bold text-lg mb-6">
          {orderId}
        </p>

        <p className="mb-6 text-gray-600">
          You can track your order using this Order ID.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Continue Shopping
          </Link>

          <Link
            href="/track"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Loading...</p></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
