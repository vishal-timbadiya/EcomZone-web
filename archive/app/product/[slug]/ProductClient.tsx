"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addToCart, getCart, saveCart } from "@/lib/cart";
import Toast from "@/app/components/Toast";
import ProductSections from "@/app/components/ProductSections";

interface Product {
  id: string;
  name: string;
  slug: string;
  productCode: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  singlePrice: number;
  cartonPrice: number;
  cartonPcsPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  category: string;
}

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [singleQty, setSingleQty] = useState(0);
  const [cartonQty, setCartonQty] = useState(0);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);

  const allImages = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : product.imageUrl ? [product.imageUrl] : [];

  const singleTotal = singleQty * product.singlePrice;
  const cartonTotal = cartonQty * product.cartonPrice;
  const subtotal = singleTotal + cartonTotal;
  const gstAmount = (subtotal * product.gstPercentage) / 100;
  const total = subtotal;
  const totalUnits = singleQty + cartonQty * product.cartonQty;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handleAddToCart = async () => {
    if (singleQty === 0 && cartonQty === 0) {
      showToast("Please select quantity");
      return;
    }
    if (product.stock < totalUnits) {
      showToast(`Only ${product.stock} units available`);
      return;
    }
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      // Update existing - set to current qty (replace)
      const updatedCart = cart.map(item => 
        item.productId === product.id 
          ? { ...item, singleQty, cartonQty }
          : item
      );
      saveCart(updatedCart);
      showToast("Cart updated!");
    } else {
      // Add new
      addToCart({ 
        productId: product.id, 
        name: product.name, 
        imageUrl: product.imageUrl, 
        singleQty, 
        cartonQty, 
        cartonQtyPerBox: product.cartonQty 
      });
      showToast("Added to cart!");
    }
  };

  const handleBuyNow = async () => {
    if (singleQty === 0 && cartonQty === 0) { 
      showToast("Please select quantity"); 
      return; 
    }
    if (product.stock < totalUnits) { 
      showToast(`Only ${product.stock} units available`); 
      return; 
    }
    const cart = getCart();
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.productId === product.id 
          ? { ...item, singleQty, cartonQty }
          : item
      );
      saveCart(updatedCart);
    } else {
      addToCart({ 
        productId: product.id, 
        name: product.name, 
        imageUrl: product.imageUrl, 
        singleQty, 
        cartonQty, 
        cartonQtyPerBox: product.cartonQty 
      });
    }
    router.push("/cart");
  };




  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const index = wishlist.indexOf(product.id);
    if (index > -1) { 
      wishlist.splice(index, 1); 
      setIsWishlisted(false); 
      showToast("Removed from wishlist"); 
    }
    else { 
      wishlist.push(product.id); 
      setIsWishlisted(true); 
      showToast("Added to wishlist"); 
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-orange-600">Home</Link>
            <span>/</span>
            <Link href={`/category/${product.category}`} className="hover:text-orange-600 capitalize">{product.category}</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                {allImages.length > 0 ? (
                  <img src={allImages[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
                <button onClick={toggleWishlist} className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition ${isWishlisted ? "bg-pink-500 text-white" : "bg-white text-gray-400 hover:text-pink-500"}`}>
                  <svg className="w-6 h-6" fill={isWishlisted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <div className="absolute top-4 left-4">
                  {product.stock > 0 ? (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">In Stock</span>
                  ) : (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">Out of Stock</span>
                  )}
                </div>
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img: string, index: number) => (
                    <button key={index} onClick={() => setSelectedImage(index)} className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${selectedImage === index ? "border-orange-500" : "border-transparent hover:border-gray-300"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6">
              <p className="text-sm text-gray-500">#{product.productCode || "N/A"}</p>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-orange-600">₹{product.singlePrice}</span>
                <span className="text-gray-500">per unit</span>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">Carton Price</p>
                    <p className="text-sm text-gray-500">{product.cartonQty} units per carton</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-600">₹{product.cartonPcsPrice}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Single Units:</span>
                    <div className="flex items-center">
                      <button onClick={() => setSingleQty(Math.max(0, singleQty - 1))} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition">-</button>
                      <span className="w-16 text-center font-semibold text-lg">{singleQty}</span>
                      <button onClick={() => setSingleQty(singleQty + 1)} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(singleQty * product.singlePrice).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Cartons (CTN):</span>
                    <div className="flex items-center">
                      <button onClick={() => setCartonQty(Math.max(0, cartonQty - 1))} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition">-</button>
                      <span className="w-16 text-center font-semibold text-lg">{cartonQty}</span>
                      <button onClick={() => setCartonQty(cartonQty + 1)} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100 transition">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{(cartonQty * product.cartonPrice).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{cartonQty * product.cartonQty} units</p>
                  </div>
                </div>
              </div>
              {subtotal > 0 && (
                <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Units:</span>
                    <span>{totalUnits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">GST ({product.gstPercentage}%):</span>
                    <span>₹{gstAmount.toFixed(2)} (Excluding)</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-700">
                    <span>Total:</span>
                    <span className="text-orange-400">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 py-4 rounded-full font-semibold bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">Add to Cart</button>
                <button onClick={handleBuyNow} disabled={product.stock === 0} className="flex-1 py-4 rounded-full font-semibold bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed">Buy Now</button>
              </div>
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium capitalize">{product.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST Rate:</span>
                  <span className="font-medium">{product.gstPercentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Available Stock:</span>
                  <span className="font-medium">{product.stock} units</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t p-6 lg:p-10">
            <h2 className="text-xl font-semibold mb-4">Product Description</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
      
      {/* Related Products Sections */}
      <ProductSections currentProductId={product.id} />
      
      <Toast message={toastMessage} show={toast} onClose={() => setToast(false)} />
    </div>
  );
}

