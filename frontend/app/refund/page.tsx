import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - EcomZone",
  description: "Refund policy for EcomZone",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Refund Policy</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>Our refund policy ensures fairness and transparency for all customers.</p>
          <h2 className="text-xl font-bold text-gray-900">Refund Eligibility</h2>
          <p>Refunds are available for damaged, defective, or incorrect items. You must report issues within 48 hours of delivery with photos.</p>
          <h2 className="text-xl font-bold text-gray-900">Refund Process</h2>
          <p>Once we receive and verify your return, refunds are processed within 5-7 business days to your original payment method.</p>
          <h2 className="text-xl font-bold text-gray-900">Non-Refundable Items</h2>
          <p>Personal care items, opened products, or items damaged due to misuse are not eligible for refund.</p>
          <h2 className="text-xl font-bold text-gray-900">Shipping Costs</h2>
          <p>Shipping costs for returns are borne by the customer unless the item is defective or incorrect.</p>
          <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
          <p>For refund requests, contact ecomzone.sales@gmail.com with your order details.</p>
        </div>
      </div>
    </div>
  );
}

