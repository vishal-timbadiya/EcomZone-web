"use client";

interface TrustBadge {
  icon: string;
  title: string;
  description: string;
}

const TRUST_BADGES: TrustBadge[] = [
  { icon: "🚚", title: "Rapid Shipping", description: "Fast delivery across India" },
  { icon: "🔒", title: "Trusted Payment", description: "Secure payment gateway" },
  { icon: "🎧", title: "24/7 Assistance", description: "Round the clock support" },
  { icon: "✨", title: "Premium Quality", description: "Verified products" },
];

export default function TrustBadgesSection() {
  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {TRUST_BADGES.map((badge, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">{badge.icon}</div>
              <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1">{badge.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

