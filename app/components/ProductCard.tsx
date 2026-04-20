"use client";

import Link from "next/link";

function getAbsoluteImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  
  // If it's a relative URL like /uploads/..., prepend the backend URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const backendUrl = apiUrl.replace(/\/api$/, '');
  return `${backendUrl}${url}`;
}

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
  isBestseller?: boolean;
  isNewArrival?: boolean;
}

interface ProductCardProps {
  product: Product;
  index: number;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: () => void;
  showQuantitySelector?: boolean;
  quantity?: { single: number; carton: number };
  onQuantityChange?: (type: "single" | "carton", value: number) => void;
  onBuyNow?: () => void;
}

export default function ProductCard({
  product,
  index,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  showQuantitySelector = false,
  quantity,
  onQuantityChange,
  onBuyNow,
}: ProductCardProps) {
  const isInWishlist = wishlist.includes(product.id);

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group fade-up flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Section */}
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={getAbsoluteImageUrl(product.imageUrl)} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              onError={(e) => { e.currentTarget.style.display = 'none'; const p = e.currentTarget.parentElement; if (p) { const fb = document.createElement('div'); fb.className = 'w-full h-full flex items-center justify-center text-gray-400'; fb.innerHTML = '<span class="text-4xl">📦</span>'; p.appendChild(fb); } }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">📦</span>
            </div>
          )}
          
          {/* Labels */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBestseller && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                Best Seller
              </span>
            )}
            {product.isNewArrival && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                New
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition shadow-lg ${
              isInWishlist 
                ? "bg-pink-500 text-white" 
                : "bg-white text-gray-400 hover:text-pink-500"
            }`}
          >
            <svg className="w-5 h-5" fill={isInWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Content Section */}
      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow">
        {/* Product Code */}
        <p className="text-xs sm:text-xs text-gray-500 mb-1">
          #{product.productCode || "N/A"}
        </p>
        
        {/* Product Name */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition text-xs sm:text-sm md:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Quantity Selector (for Trending Products) */}
        {showQuantitySelector && quantity && onQuantityChange && (
          <div className="flex items-center justify-between mb-3 bg-gray-50 rounded-lg p-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Single:</span>
              <div className="flex items-center">
                <button
                  onClick={() => onQuantityChange("single", Math.max(0, quantity.single - 1))}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-medium">{quantity.single}</span>
                <button
                  onClick={() => onQuantityChange("single", quantity.single + 1)}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">CTN:</span>
              <div className="flex items-center">
                <button
                  onClick={() => onQuantityChange("carton", Math.max(0, quantity.carton - 1))}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-medium">{quantity.carton}</span>
                <button
                  onClick={() => onQuantityChange("carton", quantity.carton + 1)}
                  className="w-6 h-6 rounded bg-white border flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price and CTN Info */}
        <div className="flex items-baseline justify-between mb-3 mt-auto">
          <div>
            <span className="text-sm sm:text-base md:text-lg font-bold text-orange-600">₹{product.singlePrice}</span>
            <span className="text-xs text-gray-500"> / unit</span>
          </div>
          <span className="text-xs text-gray-400">CTN: {product.cartonQty} pcs</span>
        </div>
        
        {/* Action Buttons */}
        {showQuantitySelector && onBuyNow ? (
          <button
            onClick={onBuyNow}
            disabled={quantity?.single === 0 && quantity?.carton === 0}
            className="w-full bg-gray-900 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-1.5 sm:py-2 md:py-2.5 rounded-lg font-medium transition mt-auto text-sm sm:text-base"
          >
            Buy Now
          </button>
        ) : (
          <button
            onClick={onAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-gray-900 hover:bg-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-1.5 sm:py-2 md:py-2.5 rounded-lg font-medium transition mt-auto text-sm sm:text-base"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

