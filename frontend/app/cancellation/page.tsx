import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation Policy - EcomZone",
  description: "Cancellation policy for EcomZone",
};

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Cancellation Policy</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>Our cancellation policy is designed to be fair and flexible for our customers.</p>
          <h2 className="text-xl font-bold text-gray-900">Order Cancellation</h2>
          <p>You can cancel your order within 24 hours of placing it, provided it has not been shipped. Contact our support team with your order number to request cancellation.</p>
          <h2 className="text-xl font-bold text-gray-900">Cancellation After Shipment</h2>
          <p>Once an order has been shipped, it cannot be cancelled. You may instead refuse the delivery and contact us for a refund.</p>
          <h2 className="text-xl font-bold text-gray-900">How to Cancel</h2>
          <p>Email ecomzone.sales@gmail.com or call +91 81608 72204 with your order number. Our team will process your cancellation request.</p>
          <h2 className="text-xl font-bold text-gray-900">Refund for Cancelled Orders</h2>
          <p>Refunds for cancelled orders are processed within 5-7 business days to your original payment method.</p>
          <h2 className="text-xl font-bold text-gray-900">Partial Cancellations</h2>
          <p>If you wish to cancel only some items from your order, contact us. only If your order has not yet shipped, We will adjust the refund accordingly.</p>
        </div>
      </div>
    </div>
  );
}

