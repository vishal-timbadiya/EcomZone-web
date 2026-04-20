"use client";

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "1K+", label: "Products Delivered Daily" },
  { value: "10+", label: "Years of Experience" },
  { value: "200+", label: "Team Members" },
  { value: "10K+", label: "Happy B2B Customers" },
];

export default function StatsSection() {
  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-r from-orange-500 to-pink-600">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center text-white">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-1 sm:mb-2 md:mb-3">{stat.value}</div>
              <div className="text-xs sm:text-sm md:text-base text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

