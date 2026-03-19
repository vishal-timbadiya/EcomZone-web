"use client";

import React from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  category: string;
}

interface TrendingSectionProps {
  products: Product[];
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
}

export default function TrendingSection(props: TrendingSectionProps) {
  const products = props.products;
  const onToggleWishlist = props.onToggleWishlist;
  const wishlist = props.wishlist;

  const trendingProducts = products.slice(0, 72);

  const productCards = trendingProducts.map(function(product: Product, index: number) {
    return React.createElement(ProductCard, {
      key: product.id,
      product: product,
      index: index,
      wishlist: wishlist,
      onToggleWishlist: onToggleWishlist,
      onAddToCart: function() { }
    });
  });

  return React.createElement("section", { id: "trending", className: "py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white" },
    React.createElement("div", { className: "max-w-7xl mx-auto px-2 sm:px-4 md:px-6" },
      React.createElement("div", { className: "flex items-center justify-between mb-4 sm:mb-6 md:mb-8" },
        React.createElement("h2", { className: "text-xl sm:text-2xl md:text-3xl font-bold text-gray-900" }, "Trending Products"),
        React.createElement(Link, { href: "/trending", className: "text-orange-600 hover:text-orange-700 font-medium text-xs sm:text-sm" }, "View All →")
      ),
      React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6" },
        productCards
      )
    )
  );
}
