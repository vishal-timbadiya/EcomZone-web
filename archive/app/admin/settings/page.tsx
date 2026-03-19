"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
  const router = useRouter();
  const [codEnabled, setCodEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const token = localStorage.getItem("adminToken");

    const res = await fetch("/api/admin/settings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.settings) {
      setCodEnabled(data.settings.codEnabled);
    }

    setLoading(false);
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
    const token = localStorage.getItem("adminToken");

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        codEnabled,
      }),
    });

    const data = await res.json();

    if (data.updatedSettings) {
      alert("Settings Updated");
    } else {
      alert("Update Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <h1 className="text-2xl font-semibold mb-8">
        System Settings
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow space-y-6 w-96">
          <div className="flex justify-between items-center">
            <span>Enable Cash on Delivery</span>
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={() => setCodEnabled(!codEnabled)}
            />
          </div>

          <button
            onClick={updateSettings}
            className="bg-black text-white px-6 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

