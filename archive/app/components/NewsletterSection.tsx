"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
          Join Our Newsletter
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-4 sm:mb-6 md:mb-8 max-w-xl mx-auto">
          Subscribe to get special offers, free giveaways, and new product updates directly to your inbox.
        </p>
        <form className="max-w-md mx-auto flex gap-2 sm:gap-3 flex-col sm:flex-row" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            suppressHydrationWarning
          />
          <button 
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-medium text-xs sm:text-sm md:text-base transition whitespace-nowrap"
            suppressHydrationWarning
          >
            {subscribed ? "✓ Subscribed!" : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}

