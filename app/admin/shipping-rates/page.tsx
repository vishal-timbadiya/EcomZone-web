"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShippingRate {
  id: string;
  state: string;
  city: string | null;
  ratePerKg: number;
  isActive: boolean;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

export default function ShippingRatesPage() {
  const router = useRouter();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [form, setForm] = useState({ state: "", city: "", ratePerKg: "" });

  const fetchRates = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    if (!token) { router.push("/admin/login"); return; }
    try {
      const res = await fetch(`${apiUrl}/shipping-rates`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRates(data.rates || []);
    } catch (e) { console.error("Failed to load rates", e); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleSubmit = async () => {
    if (!form.state || !form.ratePerKg) { alert("Please fill required fields"); return; }
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/shipping-rates`, {
        method: editingRate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: editingRate?.id,
          state: form.state,
          city: form.city || null,
          ratePerKg: parseFloat(form.ratePerKg)
        })
      });
      const data = await res.json();
      if (data.rate || data.success) {
        alert(editingRate ? "Rate updated" : "Rate created");
        setShowModal(false);
        setEditingRate(null);
        setForm({ state: "", city: "", ratePerKg: "" });
        fetchRates();
      } else { alert(data.error || "Error"); }
    } catch { alert("Error saving rate"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shipping rate?")) return;
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/shipping-rates?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { alert("Deleted"); fetchRates(); }
      else { alert("Error deleting"); }
    } catch { alert("Error"); }
  };

  const handleToggle = async (rate: ShippingRate) => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/shipping-rates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: rate.id, isActive: !rate.isActive })
      });
      if (res.ok) fetchRates();
      else alert("Error updating");
    } catch { alert("Error"); }
  };

  const openEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    setForm({ state: rate.state, city: rate.city || "", ratePerKg: String(rate.ratePerKg) });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shipping Rates</h1>
            <p className="text-gray-500 mt-1">Manage state and city wise shipping rates per kg</p>
          </div>
          <button onClick={() => { setEditingRate(null); setForm({ state: "", city: "", ratePerKg: "" }); setShowModal(true); }} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg">
            + Add Shipping Rate
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-gray-600">State</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-gray-600">City</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-gray-600">Rate (per kg)</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No shipping rates configured. Add your first rate!</td></tr>
              ) : rates.map(rate => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{rate.state}</td>
                  <td className="px-6 py-4">{rate.city || <span className="text-gray-400">All Cities</span>}</td>
                  <td className="px-6 py-4 font-semibold">₹{rate.ratePerKg}/kg</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(rate)} className={`px-3 py-1 rounded-full text-xs font-medium ${rate.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {rate.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(rate)} className="text-blue-600 hover:text-blue-800 mr-4 font-medium">Edit</button>
                    <button onClick={() => handleDelete(rate.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold mb-4">{editingRate ? "Edit Shipping Rate" : "Add Shipping Rate"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-white">
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City (Optional)</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Leave empty for all cities in state" className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate per kg (₹) *</label>
                <input type="number" value={form.ratePerKg} onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })} placeholder="e.g., 50" className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

