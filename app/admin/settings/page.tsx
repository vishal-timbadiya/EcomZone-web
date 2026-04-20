"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const router = useRouter();
  const [codEnabled, setCodEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      console.log('Fetching settings from:', `${apiUrl}/admin/settings`);
      
      const res = await fetch(`${apiUrl}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Failed to fetch settings");
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('Fetched data:', data);

      if (data.settings) {
        console.log('Setting COD:', data.settings.codEnabled);
        console.log('Setting UPI:', data.settings.upiEnabled);
        setCodEnabled(data.settings.codEnabled ?? true);
        setUpiEnabled(data.settings.upiEnabled ?? true);
        setError(null);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Error loading settings");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const userData = localStorage.getItem("adminUser");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.isSuperAdmin || user.permissions?.systemSettings) {
        fetchSettings();
      } else {
        alert("You don't have permission to access settings");
        router.push("/admin/dashboard");
      }
    }
  }, [router, fetchSettings]);

  const updateSettings = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      console.log('Saving settings:', { codEnabled, upiEnabled });

      const res = await fetch(`${apiUrl}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codEnabled,
          upiEnabled,
        }),
      });

      const data = await res.json();
      console.log('Update response:', data);

      if (data.updatedSettings) {
        console.log('Settings saved successfully:', data.updatedSettings);
        alert("Settings Updated Successfully");
        setError(null);
        // Refetch settings to confirm they were saved
        fetchSettings();
      } else {
        alert("Update Failed");
        setError("Failed to update settings");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Error updating settings");
      setError("Error updating settings");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="text-xl sm:text-2xl font-semibold mb-8">
        System Settings
      </h1>

      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow space-y-6 w-full max-w-md">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <label htmlFor="cod-toggle" className="cursor-pointer">
              <span>Enable Cash on Delivery</span>
            </label>
            <input
              id="cod-toggle"
              type="checkbox"
              checked={codEnabled}
              onChange={() => setCodEnabled(!codEnabled)}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center">
            <label htmlFor="upi-toggle" className="cursor-pointer">
              <span>Enable UPI / Online Payment</span>
            </label>
            <input
              id="upi-toggle"
              type="checkbox"
              checked={upiEnabled}
              onChange={() => setUpiEnabled(!upiEnabled)}
              className="w-5 h-5 cursor-pointer"
            />
          </div>

          <button
            onClick={updateSettings}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

