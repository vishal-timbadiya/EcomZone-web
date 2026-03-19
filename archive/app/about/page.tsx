import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us - EcomZone",
  description: "Learn more about EcomZone - Your trusted wholesale marketplace",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-orange-400">EcomZone</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Your trusted wholesale marketplace for quality products at competitive prices
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6">Who We Are</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            EcomZone is a premier B2B ecommerce platform dedicated to simplifying wholesale purchasing for retailers and businesses across India. We provide a seamless marketplace where businesses can source quality products at transparent wholesale prices with complete GST billing.
          </p>

          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Our mission is to revolutionize the wholesale shopping experience by providing a transparent, efficient, and user-friendly platform. We aim to connect manufacturers, distributors, and retailers through technology, making bulk purchasing as easy as shopping for personal use.
          </p>

          <h2 className="text-2xl font-bold mb-6">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-sm text-gray-600">Clear pricing with no hidden costs. Full GST billing on all orders.</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="font-semibold mb-2">Bulk Orders</h3>
              <p className="text-sm text-gray-600">Order single units or full cartons. Flexible quantity options for all needs.</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="text-3xl mb-3">🚚</div>
              <h3 className="font-semibold mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Quick delivery across India with reliable shipping partners.</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="text-3xl mb-3">🎧</div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Round-the-clock customer support for all your queries.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6">Our Values</h2>
          <ul className="space-y-3 text-gray-600 mb-8">
            <li className="flex items-center gap-3">
              <span className="text-orange-500">✓</span>
              Customer-first approach in everything we do
            </li>
            <li className="flex items-center gap-3">
              <span className="text-orange-500">✓</span>
              Transparency in pricing and business practices
            </li>
            <li className="flex items-center gap-3">
              <span className="text-orange-500">✓</span>
              Quality products from verified sellers
            </li>
            <li className="flex items-center gap-3">
              <span className="text-orange-500">✓</span>
              Continuous innovation in our services
            </li>
          </ul>

          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <div className="space-y-3 text-gray-600">
              <p>📧 Email: ecomzone.sales@gmail.com</p>
              <p>📞 Phone: +91 81608 72204</p>
              <p>📍 Location: Surat, Gujarat, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

