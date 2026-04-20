import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return Policy - EcomZone",
  description: "Return policy for EcomZone",
};

export default function ReturnPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Return Policy</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>We want you to be completely satisfied with your purchase. Here is our return policy.</p>
          <h2 className="text-xl font-bold text-gray-900">Return Eligibility</h2>
          <p>Items can be returned within 1-2 days of delivery if they are received only the wrong product, unused, in original packaging, and in resalable condition.</p>
          <h2 className="text-xl font-bold text-gray-900">How to Return</h2>
          <p>Contact our support team with your order number and photos of the item. We will provide return instructions.</p>
          <h2 className="text-xl font-bold text-gray-900">Return Shipping</h2>
          <p>Customers are responsible for return shipping costs unless the item is defective or we shipped the wrong product.</p>
          <h2 className="text-xl font-bold text-gray-900">Refund Timeline</h2>
          <p>Refunds are processed within 5-7 business days after we receive and inspect the returned item.</p>
          <h2 className="text-xl font-bold text-gray-900">Exchanges</h2>
          <p>We offer exchanges for the same product if a different size or variant is needed. Contact us to arrange an exchange.</p>
        </div>
      </div>
    </div>
  );
}

