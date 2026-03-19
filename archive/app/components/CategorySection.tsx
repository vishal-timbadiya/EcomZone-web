"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string;
  productCount?: number;
}

// Removed hardcoded DEFAULT_CATEGORIES - now dynamic from /api/admin/products

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories from products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return React.createElement("section", { className: "py-12 bg-white" },
      React.createElement("div", { className: "max-w-7xl mx-auto px-4" },
        React.createElement("div", { className: "bg-white rounded-xl shadow-md p-8 mb-8" },
          React.createElement("h1", { className: "text-3xl font-bold text-gray-900 mb-2" }, "All Categories"),
          React.createElement("p", { className: "text-gray-500" }, "Browse our wide range of product categories.")
        ),
        React.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4" },
          [...Array(8)].map((_, i) => 
            React.createElement("div", { key: i, className: "bg-white rounded-3xl p-6 animate-pulse shadow-md" },
              React.createElement("div", { className: "w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200" }),
              React.createElement("div", { className: "h-4 bg-gray-200 rounded-full mx-auto w-20" })
            )
          )
        )
      )
    );
  }

  return React.createElement("section", { className: "py-12 bg-white", id: "categories" },
    React.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6" },
      React.createElement("div", { className: "flex items-center justify-between mb-8" },
        React.createElement("div", null,
          React.createElement("h1", { className: "text-3xl font-bold text-gray-900 mb-2" }, "All Categories"),
          React.createElement("p", { className: "text-gray-500" }, "Browse our wide range of product categories.")
        ),
        React.createElement(Link, { href: "/categories", className: "text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap" }, "View All →")
      ),
      categories.length > 0 
        ? React.createElement("div", { className: "flex gap-4 overflow-x-auto pb-4 scrollbar-hide" },
            categories.map((category, index) =>
              React.createElement(Link, { 
                key: category.id, 
                href: "/category/" + category.slug,
                className: "group fade-up bg-white rounded-3xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex-shrink-0 min-w-[160px]",
                style: { animationDelay: (index * 50) + "ms" }
              },
                React.createElement("div", { className: "w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center border-4 border-orange-200 shadow-md" },
                  category.imageUrl && category.imageUrl.trim() 
                    ? React.createElement("img", { 
                        src: category.imageUrl, 
                        alt: category.name,
                        className: "w-full h-full object-cover"
                      })
                    : React.createElement("span", { className: "text-3xl" }, category.icon || "📦")
                ),
                React.createElement("h3", { className: "text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition whitespace-nowrap" }, category.name)
              )
            )
          )
        : React.createElement("div", { className: "text-center py-8 text-gray-500" }, "No categories available.")
    )
  );
}
