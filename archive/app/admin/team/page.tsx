"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SubAdmin {
  id: string;
  name: string;
  email: string;
  mobile: string;
  isActive: boolean;
  permissions: {
    manageProducts?: boolean;
    manageOrders?: boolean;
    manageUsers?: boolean;
    systemSettings?: boolean;
  };
  createdAt: string;
}

export default function AdminTeam() {
  const router = useRouter();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Create form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    manageProducts: false,
    manageOrders: false,
    manageUsers: false,
    systemSettings: false,
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    manageProducts: false,
    manageOrders: false,
    manageUsers: false,
    systemSettings: false,
  });
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Declare fetchSubAdmins before useEffect
  const fetchSubAdmins = async () => {
    const token = localStorage.getItem("adminToken");
    
    const res = await fetch("/api/auth/sub-admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    
    if (data.subAdmins) {
      setSubAdmins(data.subAdmins);
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const userData = localStorage.getItem("adminUser");
    if (userData) {
      const user = JSON.parse(userData);
      if (!user.isSuperAdmin) {
        alert("Access denied. Super admin only.");
        router.push("/admin/dashboard");
        return;
      }
    }

    fetchSubAdmins();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!form.name || !form.email || !form.mobile || !form.password) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    const permissions = {
      manageProducts: form.manageProducts,
      manageOrders: form.manageOrders,
      manageUsers: form.manageUsers,
      systemSettings: form.systemSettings,
    };

    const token = localStorage.getItem("adminToken");

    const res = await fetch("/api/auth/sub-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        permissions,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Sub-admin created successfully!");
      setShowModal(false);
      setForm({
        name: "",
        email: "",
        mobile: "",
        password: "",
        manageProducts: false,
        manageOrders: false,
        manageUsers: false,
        systemSettings: false,
      });
      fetchSubAdmins();
    } else {
      setError(data.message || "Failed to create sub-admin");
    }

    setSubmitting(false);
  };

  // Start editing
  const startEdit = (admin: SubAdmin) => {
    setEditingId(admin.id);
    setEditForm({
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      password: "",
      manageProducts: admin.permissions?.manageProducts || false,
      manageOrders: admin.permissions?.manageOrders || false,
      manageUsers: admin.permissions?.manageUsers || false,
      systemSettings: admin.permissions?.systemSettings || false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      manageProducts: false,
      manageOrders: false,
      manageUsers: false,
      systemSettings: false,
    });
  };

  const saveEdit = async (id: string) => {
    setError("");
    
    if (!editForm.name || !editForm.email || !editForm.mobile) {
      setError("Name, email and mobile are required");
      return;
    }

    setSubmitting(true);

    const permissions = {
      manageProducts: editForm.manageProducts,
      manageOrders: editForm.manageOrders,
      manageUsers: editForm.manageUsers,
      systemSettings: editForm.systemSettings,
    };

    const token = localStorage.getItem("adminToken");

    // Only include password if it's provided
    const updateData: Record<string, unknown> = {
      name: editForm.name,
      email: editForm.email,
      mobile: editForm.mobile,
      permissions,
    };

    if (editForm.password) {
      if (editForm.password.length < 6) {
        setError("Password must be at least 6 characters");
        setSubmitting(false);
        return;
      }
      updateData.password = editForm.password;
    }

    const res = await fetch(`/api/auth/sub-admin/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Sub-admin updated successfully!");
      setEditingId(null);
      setEditForm({
        name: "",
        email: "",
        mobile: "",
        password: "",
        manageProducts: false,
        manageOrders: false,
        manageUsers: false,
        systemSettings: false,
      });
      fetchSubAdmins();
    } else {
      setError(data.message || "Failed to update sub-admin");
    }

    setSubmitting(false);
  };

  const toggleSubAdmin = async (id: string) => {
    const token = localStorage.getItem("adminToken");

    const res = await fetch(`/api/auth/sub-admin/${id}/toggle`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchSubAdmins();
    }
  };

  const deleteSubAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sub-admin?")) return;

    const token = localStorage.getItem("adminToken");

    const res = await fetch(`/api/auth/sub-admin/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      alert("Sub-admin deleted successfully!");
      fetchSubAdmins();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Admin Team</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-6 py-2 rounded"
        >
          Add Sub-Admin
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : subAdmins.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center">
          <p className="text-gray-500">No sub-admins found. Create your first sub-admin!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subAdmins.map((admin) => (
            <div key={admin.id} className="bg-white p-6 rounded-xl shadow">
              {editingId === admin.id ? (
                // Edit Mode
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Edit Sub-Admin</h3>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full border px-4 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="w-full border px-4 py-2 rounded"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mobile</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={editForm.mobile}
                        onChange={handleEditChange}
                        className="w-full border px-4 py-2 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        name="password"
                        value={editForm.password}
                        onChange={handleEditChange}
                        className="w-full border px-4 py-2 rounded"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <p className="font-medium mb-3">Permissions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="manageProducts"
                          checked={editForm.manageProducts}
                          onChange={handleEditChange}
                        />
                        Manage Products
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="manageOrders"
                          checked={editForm.manageOrders}
                          onChange={handleEditChange}
                        />
                        Manage Orders
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="manageUsers"
                          checked={editForm.manageUsers}
                          onChange={handleEditChange}
                        />
                        Manage Users
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="systemSettings"
                          checked={editForm.systemSettings}
                          onChange={handleEditChange}
                        />
                        System Settings
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(admin.id)}
                      disabled={submitting}
                      className="bg-green-500 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="border px-6 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{admin.name}</h3>
                      <p className="text-gray-500 text-sm">{admin.email}</p>
                      <p className="text-gray-500 text-sm">{admin.mobile}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        admin.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {admin.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {admin.permissions?.manageProducts && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded">
                          Products
                        </span>
                      )}
                      {admin.permissions?.manageOrders && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 text-xs rounded">
                          Orders
                        </span>
                      )}
                      {admin.permissions?.manageUsers && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded">
                          Users
                        </span>
                      )}
                      {admin.permissions?.systemSettings && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                          Settings
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(admin)}
                      className="bg-blue-500 text-white px-4 py-2 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleSubAdmin(admin.id)}
                      className={`py-2 px-4 rounded text-sm ${
                        admin.isActive
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {admin.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => deleteSubAdmin(admin.id)}
                      className="bg-red-100 text-red-700 py-2 px-4 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Sub-Admin Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-6">Add Sub-Admin</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className="w-full border px-4 py-2 rounded"
                value={form.name}
                onChange={handleChange}
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full border px-4 py-2 rounded"
                value={form.email}
                onChange={handleChange}
              />

              <input
                type="tel"
                name="mobile"
                placeholder="Mobile Number"
                className="w-full border px-4 py-2 rounded"
                value={form.mobile}
                onChange={handleChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full border px-4 py-2 rounded"
                value={form.password}
                onChange={handleChange}
              />

              <div className="border-t pt-4">
                <p className="font-medium mb-3">Permissions:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="manageProducts"
                      checked={form.manageProducts}
                      onChange={handleChange}
                    />
                    Manage Products
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="manageOrders"
                      checked={form.manageOrders}
                      onChange={handleChange}
                    />
                    Manage Orders
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="manageUsers"
                      checked={form.manageUsers}
                      onChange={handleChange}
                    />
                    Manage Users
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="systemSettings"
                      checked={form.systemSettings}
                      onChange={handleChange}
                    />
                    System Settings
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-black text-white py-2 rounded disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

