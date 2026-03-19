"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCart, saveCart, CartItem } from "@/lib/cart";

interface ProductDetails {
  id: string;
  name: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  gstPercentage: number;
  stock: number;
  weight: number;
}

interface Address {
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface GstDetails {
  gstNumber: string;
  companyName: string;
  businessEmail: string;
}

interface ShippingRate {
  id: string;
  state: string;
  city: string | null;
  ratePerKg: number;
  isActive: boolean;
}

const MIN_ORDER_VALUE = 2500;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

const INDIAN_CITIES = [
  "Ahmedabad", "Amritsar", "Bangalore", "Bhopal", "Bhubaneswar",
  "Chandigarh", "Chennai", "Coimbatore", "Dehradun", "Delhi", "Faridabad", "Ghaziabad",
  "Gurgaon", "Guwahati", "Hyderabad", "Indore", "Jaipur", "Jalandhar",
  "Kochi", "Kolkata", "Kota", "Lucknow", "Ludhiana", "Madurai",
  "Mumbai", "Mysore", "Nagpur", "Nashik", "Navi Mumbai", "Noida", "Patna", "Pune",
  "Raipur", "Ranchi", "Surat", "Thiruvananthapuram", "Vadodara", "Varanasi"
];

// Stable address field component to prevent re-renders
function AddressField({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder,
  maxLength,
  options,
  textarea,
  onFocus,
  onBlur
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  type?: string; 
  placeholder?: string;
  maxLength?: number;
  options?: string[];
  textarea?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const baseInputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all";
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={baseInputClass}
        />
      ) : options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} bg-white`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          className={baseInputClass}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Record<string, ProductDetails>>({});
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [paymentMode, setPaymentMode] = useState("COD");
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState("");
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

  const [shippingAddress, setShippingAddress] = useState<Address>({ name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [billingAddress, setBillingAddress] = useState<Address>({ name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [useGstBilling, setUseGstBilling] = useState(false);
  const [gstDetails, setGstDetails] = useState<GstDetails>({ gstNumber: "", companyName: "", businessEmail: "" });

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Initialize cart on mount
  useEffect(() => {
    setCartItems(getCart());
  }, []);

  // Fetch products
  useEffect(() => {
    if (cartItems.length === 0) {
      setProductsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const data = await Promise.all(
          cartItems.map(i => fetch(`/api/products/${i.productId}`).then(r => r.ok ? r.json() : null))
        );
        const map: Record<string, ProductDetails> = {};
        data.forEach((p, i) => { if (p) map[cartItems[i].productId] = p; });
        setProducts(map);
      } catch { 
        setError("Failed to load products"); 
      } finally { 
        setProductsLoading(false); 
      }
    };

    fetchProducts();
  }, [cartItems]);

  // Fetch shipping rates
  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        const res = await fetch("/api/shipping-rates");
        if (res.ok) {
          const data = await res.json();
          setShippingRates(data.rates || []);
        }
      } catch (e) { 
        console.error("Failed to load shipping rates", e); 
      }
    };
    fetchShippingRates();
  }, []);

  // Set mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemoveItem = useCallback((pid: string) => { 
    const c = cartItems.filter(i => i.productId !== pid); 
    setCartItems(c); 
    saveCart(c); 
  }, [cartItems]);

  // Memoized totals calculation
  const totals = useMemo(() => {
    let subtotal = 0, gst = 0, totalWeight = 0;
    
    cartItems.forEach(item => {
      const p = products[item.productId];
      if (!p) return;
      
      const singleTotal = item.singleQty * p.singlePrice;
      const cartonTotal = item.cartonQty * p.cartonPrice;
      const itemSubtotal = singleTotal + cartonTotal;
      
      subtotal += itemSubtotal;
      gst += (itemSubtotal * p.gstPercentage) / 100;
      
      const totalGrams = (item.singleQty + item.cartonQty * (p.cartonQty || 1)) * (p.weight || 0);
      totalWeight += totalGrams / 1000;
    });

    let shippingCharge = 0;
    const shippingCity = shippingAddress.city.toLowerCase();
    const shippingState = shippingAddress.state;
    
    if (shippingCity && shippingState) {
      const cityRate = shippingRates.find(r => r.isActive && r.city && r.city.toLowerCase() === shippingCity && r.state && r.state.toLowerCase() === shippingState.toLowerCase());
      const stateRate = shippingRates.find(r => r.isActive && r.state && r.state.toLowerCase() === shippingState.toLowerCase() && !r.city);
      const rate = cityRate || stateRate;
      if (rate) { shippingCharge = Math.ceil(totalWeight) * rate.ratePerKg; }
    }

    const totalWithGst = subtotal + gst;
    const finalTotal = useGstBilling ? totalWithGst + shippingCharge : subtotal + shippingCharge;

    return { subtotal, gst, totalWeight, shippingCharge, totalWithGst, finalTotal };
  }, [cartItems, products, shippingAddress, shippingRates, useGstBilling]);

  const { subtotal, gst, totalWeight, shippingCharge, totalWithGst, finalTotal } = totals;

  const handleCityChange = useCallback((value: string) => {
    setShippingAddress(prev => ({ ...prev, city: value }));
    if (value.length > 0) {
      const filtered = INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5);
      setCitySuggestions(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else { 
      setShowCitySuggestions(false); 
    }
  }, []);

  const selectCity = useCallback((city: string) => { 
    setShippingAddress(prev => ({ ...prev, city })); 
    setShowCitySuggestions(false); 
  }, []);

  const validate = useCallback((): boolean => {
    if (!shippingAddress.name || !shippingAddress.mobile || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) { 
      alert("Please fill all required shipping fields"); 
      return false; 
    }
    if (shippingAddress.mobile.length < 10 || shippingAddress.pincode.length < 6) { 
      alert("Invalid mobile/pincode"); 
      return false; 
    }
    if (!sameAsShipping && (!billingAddress.name || !billingAddress.city || !billingAddress.state)) { 
      alert("Fill billing address"); 
      return false; 
    }
    if (useGstBilling && (!gstDetails.gstNumber || gstDetails.gstNumber.length !== 15 || !gstDetails.companyName)) { 
      alert("Fill GST number and company name"); 
      return false; 
    }
    return true;
  }, [shippingAddress, sameAsShipping, billingAddress, useGstBilling, gstDetails]);

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      setTermsError("Please accept Terms & Conditions and Privacy Policy to place order");
      return;
    }
    setTermsError("");
    if (!cartItems.length || finalTotal < MIN_ORDER_VALUE || !validate()) return;
    const token = localStorage.getItem("token");
    if (!token) { alert("Please login first"); router.push("/login"); return; }

    try {
      setLoading(true);
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          cartItems, 
          paymentMode, 
          shippingAddress, 
          billingAddress: sameAsShipping ? shippingAddress : billingAddress, 
          useGstBilling, 
          gstDetails: useGstBilling ? gstDetails : null, 
          shippingCharge, 
          totalWeight 
        })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Order failed"); setError(data.error); return; }
      saveCart([]); 
      setCartItems([]); 
      router.push(`/payment-success?orderId=${data.orderId}`);
    } catch { 
      alert("Error placing order"); 
      router.push("/payment-failure"); 
    }
    finally { setLoading(false); }
  };

  const renderItem = useCallback((item: CartItem) => {
    const p = products[item.productId];
    if (!p) return <div key={item.productId} className="p-4 bg-gray-50 rounded-xl">Loading...</div>;
    const qty = item.singleQty + item.cartonQty * p.cartonQty;
    const sub = item.singleQty * p.singlePrice + item.cartonQty * p.cartonPrice;
    const g = sub * p.gstPercentage / 100;
    return (
      <div key={item.productId} className="border p-4 rounded-xl bg-white">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-500">
                  {item.singleQty > 0 && "Single: " + item.singleQty + " x Rs" + p.singlePrice}
                  {item.singleQty > 0 && item.cartonQty > 0 && " | "}
                  {item.cartonQty > 0 && "Carton: " + item.cartonQty + " x Rs" + p.cartonPrice}
                </p>
              </div>
              <button onClick={() => handleRemoveItem(item.productId)} className="text-gray-400 hover:text-red-500">X</button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Qty: {qty}</span>
              <div className="text-right">
                <p className="font-semibold">Rs{sub.toFixed(2)}</p>
                <p className="text-xs text-gray-500">+ Rs{g.toFixed(2)} GST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [products, handleRemoveItem]);

  if (!mounted || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button onClick={() => router.push("/")} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold">Continue Shopping</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 font-bold">1</span></div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AddressField label="Full Name *" value={shippingAddress.name} onChange={(v) => setShippingAddress(s => ({...s, name: v}))} placeholder="Full name" />
                  <AddressField label="Mobile *" value={shippingAddress.mobile} onChange={(v) => setShippingAddress(s => ({...s, mobile: v}))} type="tel" placeholder="10-digit mobile" maxLength={10} />
                  <AddressField label="Email (Optional)" value={shippingAddress.email} onChange={(v) => setShippingAddress(s => ({...s, email: v}))} type="email" placeholder="email@example.com" />
                  <div className="md:col-span-1">
                    <AddressField label="Address *" value={shippingAddress.address} onChange={(v) => setShippingAddress(s => ({...s, address: v}))} placeholder="House No., Building, Street" textarea />
                  </div>
                  <div className="relative">
                    <AddressField label="City *" value={shippingAddress.city} onChange={handleCityChange} placeholder="Start typing city..."
                      onFocus={() => { 
                        if (shippingAddress.city.length > 0) { 
                          const f = INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(shippingAddress.city.toLowerCase())).slice(0,5); 
                          setCitySuggestions(f); 
                          setShowCitySuggestions(f.length > 0); 
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                        {citySuggestions.map((city, i) => (
                          <li key={i} onClick={() => selectCity(city)} className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm">{city}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <AddressField label="State *" value={shippingAddress.state} onChange={(v) => setShippingAddress(s => ({...s, state: v}))} placeholder="Select State" options={INDIAN_STATES} />
                  <AddressField label="Pincode *" value={shippingAddress.pincode} onChange={(v) => setShippingAddress(s => ({...s, pincode: v}))} type="tel" placeholder="6-digit pincode" maxLength={6} />
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 font-bold">2</span></div>
                  <h2 className="text-xl font-bold text-gray-900">Billing Address</h2>
                </div>
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} className="w-4 h-4 text-orange-500 rounded" />
                  <span className="text-gray-700">Same as shipping address</span>
                </label>
                {!sameAsShipping && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AddressField label="Full Name *" value={billingAddress.name} onChange={(v) => setBillingAddress(s => ({...s, name: v}))} placeholder="Full name" />
                    <AddressField label="Mobile *" value={billingAddress.mobile} onChange={(v) => setBillingAddress(s => ({...s, mobile: v}))} type="tel" placeholder="10-digit mobile" maxLength={10} />
                    <AddressField label="Email (Optional)" value={billingAddress.email} onChange={(v) => setBillingAddress(s => ({...s, email: v}))} type="email" placeholder="email@example.com" />
                    <AddressField label="Address *" value={billingAddress.address} onChange={(v) => setBillingAddress(s => ({...s, address: v}))} placeholder="House No., Building, Street" textarea />
                    <AddressField label="City *" value={billingAddress.city} onChange={(v) => setBillingAddress(s => ({...s, city: v}))} placeholder="Select City" />
                    <AddressField label="State *" value={billingAddress.state} onChange={(v) => setBillingAddress(s => ({...s, state: v}))} placeholder="Select State" options={INDIAN_STATES} />
                    <AddressField label="Pincode *" value={billingAddress.pincode} onChange={(v) => setBillingAddress(s => ({...s, pincode: v}))} type="tel" placeholder="6-digit pincode" maxLength={6} />
                  </div>
                )}
              </div>

              {/* GST Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 font-bold">3</span></div>
                  <h2 className="text-xl font-bold text-gray-900">GST Details (Optional)</h2>
                </div>
                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={useGstBilling} onChange={(e) => setUseGstBilling(e.target.checked)} className="w-4 h-4 text-orange-500 rounded" />
                  <span className="text-gray-700">I want GST billing</span>
                </label>
                {useGstBilling && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AddressField label="GST Number *" value={gstDetails.gstNumber} onChange={(v) => setGstDetails(g => ({...g, gstNumber: v.toUpperCase()}))} placeholder="15-digit GST Number" maxLength={15} />
                    <AddressField label="Company Name *" value={gstDetails.companyName} onChange={(v) => setGstDetails(g => ({...g, companyName: v}))} placeholder="Registered Company Name" />
                    <div className="md:col-span-2">
                      <AddressField label="Business Email (Optional)" value={gstDetails.businessEmail} onChange={(v) => setGstDetails(g => ({...g, businessEmail: v}))} type="email" placeholder="business@email.com" />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-orange-600 font-bold">4</span></div>
                  <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
                </div>
                <div className="space-y-4">{cartItems.map(renderItem)}</div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment and Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs{subtotal.toFixed(2)}</span></div>
                  
                  {useGstBilling && (
                    <div className="flex justify-between text-green-600"><span>GST</span><span>Rs{gst.toFixed(2)}</span></div>
                  )}
                  
                  {totalWeight > 0 && (
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Shipping ({totalWeight.toFixed(2)} kg)</span>
                      <span>Rs{shippingCharge.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex justify-between text-xl font-bold"><span>Total Payable</span><span className="text-orange-600">Rs{finalTotal.toFixed(2)}</span></div>
                </div>

                {finalTotal < MIN_ORDER_VALUE && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
                    <p className="text-orange-700 text-sm">Minimum order value is Rs{MIN_ORDER_VALUE}. Add Rs{(MIN_ORDER_VALUE - finalTotal).toFixed(2)} more to proceed.</p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2"> Payment Mode</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500">
                      <input type="radio" name="paymentMode" value="COD" checked={paymentMode === "COD"} onChange={(e) => setPaymentMode(e.target.value)} className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-700">Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-500">
                      <input type="radio" name="paymentMode" value="UPI" checked={paymentMode === "UPI"} onChange={(e) => setPaymentMode(e.target.value)} className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-700">UPI / Online Payment</span>
                    </label>
                  </div>
                </div>

                {/* Terms Checkbox */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-500">
                    <input 
                      type="checkbox" 
                      required 
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        if (e.target.checked) setTermsError("");
                      }}
                      className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      I agree to <Link href="/terms" className="text-orange-600 hover:underline font-semibold">Terms & Conditions</Link> and <Link href="/privacy" className="text-orange-600 hover:underline font-semibold">Privacy Policy</Link>
                    </span>
                  </label>
                  {termsError && (
                    <p className="text-red-600 text-sm mt-1 ml-12">{termsError}</p>
                  )}
                </div>
                
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || finalTotal < MIN_ORDER_VALUE}
                  className={"w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 rounded-xl font-semibold " + (loading || finalTotal < MIN_ORDER_VALUE ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg")}
                >
                  {loading ? "Processing..." : "Place Order - Rs" + finalTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

