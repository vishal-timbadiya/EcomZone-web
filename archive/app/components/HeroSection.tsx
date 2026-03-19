"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-up">
          Wholesale. <span className="text-orange-400">Simplified.</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Order single units or full cartons with transparent pricing and GST. 
          B2B ecommerce made simple for retailers and businesses.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="#categories"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition transform hover:scale-105 shadow-lg hover:shadow-orange-500/30"
          >
            Shop Now
          </Link>
          <Link 
            href="#trending"
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium transition border border-white/30"
          >
            View Trending
          </Link>
        </div>
      </div>
    </section>
  );
}

