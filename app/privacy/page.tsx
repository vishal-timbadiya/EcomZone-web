import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - EcomZone",
  description: "Privacy policy for EcomZone",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 space-y-6 text-gray-600 leading-relaxed">
          <p>At EcomZone, we value your privacy. This policy explains how we collect, use, and protect your information.</p>
          <h2 className="text-xl font-bold text-gray-900">Information We Collect</h2>
          <p>We collect personal information such as name, email, phone number, and address when you register or place an order. We also collect payment information securely through our payment partners.</p>
          <h2 className="text-xl font-bold text-gray-900">How We Use Your Information</h2>
          <p>Your information is used to process orders, provide customer support, send order updates, and improve our services. We may also use it for marketing purposes with your consent.</p>
          <h2 className="text-xl font-bold text-gray-900">Data Protection</h2>
          <p>We implement appropriate security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
          <h2 className="text-xl font-bold text-gray-900">Sharing Information</h2>
          <p>We do not sell your personal information. We may share it with service providers who assist us in operating our website and processing orders.</p>
          <h2 className="text-xl font-bold text-gray-900">Cookies</h2>
          <p>We use cookies to enhance your experience. You can set your browser to refuse cookies, but this may affect website functionality.</p>
          <h2 className="text-xl font-bold text-gray-900">Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
          <h2 className="text-xl font-bold text-gray-900">Changes to Policy</h2>
          <p>We may update this policy periodically. Any changes will be posted on this page.</p>
        </div>
      </div>
    </div>
  );
}

