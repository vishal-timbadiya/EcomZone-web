"use client";

import { useRouter } from "next/navigation";

export default function PaymentFailure() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
            <p className="text-gray-600">Sorry, your payment could not be completed. Please try again.</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">
              Possible reasons:
            </p>
            <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
              <li>Payment was declined by your bank</li>
              <li>Network connection issue</li>
              <li>Invalid payment details</li>
              <li>Insufficient balance</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => router.push("/checkout")} 
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Go to Home
            </button>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">Need help? <a href="/contact" className="text-red-500 hover:underline">Contact Support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

