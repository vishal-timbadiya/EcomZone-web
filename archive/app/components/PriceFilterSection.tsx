"use client";

import Link from "next/link";
import Image from "next/image";

interface PriceRange {
  label: string;
  min: number;
  max: number;
  slug: string;
}

const PRICE_RANGES: PriceRange[] = [
  { label: "Under ₹9", min: 0, max: 9, slug: "under-9" },
  { label: "Under ₹49", min: 9, max: 49, slug: "under-49" },
  { label: "Under ₹99", min: 49, max: 99, slug: "under-99" },
  { label: "Under ₹149", min: 99, max: 149, slug: "under-149" },
  { label: "Under ₹249", min: 149, max: 249, slug: "under-249" },
  { label: "Under ₹499", min: 249, max: 499, slug: "under-499" },
  { label: "₹499+", min: 499, max: 99999, slug: "499-plus" },
];

export default function PriceFilterSection() {
  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
          Shop by Price Range
        </h2>
        
        {/* Single Row */}
        <div className="flex overflow-x-auto md:overflow-x-visible gap-2 sm:gap-3 pb-2 md:pb-0">
          {PRICE_RANGES.map((range, index) => (
            <Link
              key={index}
              href={`/price/${range.slug}`}
              className="group flex-shrink-0 w-full md:flex-1 min-w-[110px] sm:min-w-[130px] md:min-w-auto"
            >
              {/* Simple Card */}
              <div className="bg-gray-50 hover:bg-orange-100 border border-gray-200 hover:border-orange-400 rounded-lg p-3 sm:p-4 md:p-5 text-center transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                {/* Label */}
                <h3 className="text-gray-700 hover:text-orange-600 font-medium text-xs sm:text-sm md:text-base transition-colors">
                  {range.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

