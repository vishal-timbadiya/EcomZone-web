import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy - EcomZone",
  description: "Shipping policy for EcomZone",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Shipping Policy</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>We strive to deliver your orders quickly and safely across India.</p>
          <h2 className="text-xl font-bold text-gray-900">Shipping Locations</h2>
          <p>We ship to all major cities and towns across India. Remote locations may take longer for delivery.</p>
          <h2 className="text-xl font-bold text-gray-900">Delivery Time</h2>
          <p>Standard delivery takes 5-7 business days. Express delivery (where available) takes 2-3 business days. Orders are processed within 24-48 hours.</p>
          <h2 className="text-xl font-bold text-gray-900">Shipping Charges</h2>
          <p>Shipping charges vary based on order value and location.</p>
          <h2 className="text-xl font-bold text-gray-900">Order Tracking</h2>
          <p>Once your order is shipped, you will receive a tracking number via SMS and email. You can track your order on our website.</p>
          <h2 className="text-xl font-bold text-gray-900">Delivery Partners</h2>
          <p>We work with reliable delivery partners to ensure safe and timely delivery of your orders.</p>
          <h2 className="text-xl font-bold text-gray-900">Delivery Attempts</h2>
          <p>Our delivery partner will attempt delivery thrice. If unsuccessful, the order will be returned to us.</p>
          <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
          <p>For shipping inquiries, contact ecomzone.sales@gmail.com or call +91 81608 72204.</p>
        </div>
      </div>
    </div>
  );
}

