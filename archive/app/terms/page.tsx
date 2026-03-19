import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions - EcomZone",
  description: "Terms and conditions for using EcomZone",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Terms & Conditions</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>Welcome to EcomZone. By accessing and using our website, you agree to be bound by these terms and conditions.</p>
          <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p>By using this website, you accept these terms in full. If you disagree with these terms, please do not use our website.</p>
          <h2 className="text-xl font-bold text-gray-900">2. Product Information</h2>
          <p>We strive to provide accurate product descriptions and pricing. However, we reserve the right to correct any errors without liability.</p>
          <h2 className="text-xl font-bold text-gray-900">3. Order Processing</h2>
          <p>Orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order.</p>
          <h2 className="text-xl font-bold text-gray-900">4. Payment Terms</h2>
          <p>Payment must be made at the time of order. We accept various payment methods including COD, UPI, and other online payments.</p>
          <h2 className="text-xl font-bold text-gray-900">5. Shipping & Delivery</h2>
          <p>Delivery times may vary based on location. We are not responsible for delays caused by circumstances beyond our control.</p>
          <h2 className="text-xl font-bold text-gray-900">6. Intellectual Property</h2>
          <p>All content on this website is the property of EcomZone and may not be reproduced without permission.</p>
          <h2 className="text-xl font-bold text-gray-900">7. Limitation of Liability</h2>
          <p>EcomZone shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website.</p>
          <h2 className="text-xl font-bold text-gray-900">8. Governing Law</h2>
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Surat, Gujarat.</p>
        </div>
      </div>
    </div>
  );
}

