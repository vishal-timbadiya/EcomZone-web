"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  password?: string;
  createdAt: string;
}

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [roleFilter, setRoleFilter] = useState("");
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    const userData = localStorage.getItem("adminUser");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.isSuperAdmin || user.permissions?.manageUsers) {
        fetchUsers();
      } else {
        alert("You don't have permission to manage users");
        router.push("/admin/dashboard");
      }
    }
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  };

  const getFilteredAndSortedUsers = () => {
    let filtered = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.mobile.includes(q));
    }
    if (roleFilter) filtered = filtered.filter((u) => u.role === roleFilter);
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "email") cmp = a.email.localeCompare(b.email);
      else if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return filtered;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  const getSortIndicator = (field: SortField) => sortField !== field ? "" : sortOrder === "asc" ? " ↑" : " ↓";

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, mobile: user.mobile });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (id: string) => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editForm.name, email: editForm.email, mobile: editForm.mobile }),
    });
    if (res.ok) { alert("User updated"); setEditingId(null); fetchUsers(); }
    else { const data = await res.json(); alert(data.message || "Error updating user"); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { alert("User deleted"); fetchUsers(); }
    else { const data = await res.json(); alert(data.message || "Error deleting user"); }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setResetLoading(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password reset successfully!");
        setResetPasswordId(null);
        setNewPassword("");
      } else {
        alert(data.message || "Error resetting password");
      }
    } catch (error) {
      alert("Error resetting password");
    } finally {
      setResetLoading(false);
    }
  };

  const filteredUsers = getFilteredAndSortedUsers();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-10">
      <h1 className="text-xl sm:text-2xl font-semibold mb-8">Manage Users</h1>
      
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-center">
          <div className="flex-1 min-w-full sm:min-w-[200px]">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border p-1 sm:p-2 rounded" />
          </div>
          <div className="min-w-full sm:min-w-[150px]">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full border p-1 sm:p-2 rounded">
              <option value="">All Roles</option>
              <option value="USER">Customer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="min-w-full sm:min-w-[150px]">
            <select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)} className="w-full border p-1 sm:p-2 rounded">
              <option value="createdAt">Date Joined</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="min-w-full sm:min-w-[100px]">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="w-full border p-1 sm:p-2 rounded">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          {(searchQuery || roleFilter) && (
            <button onClick={() => { setSearchQuery(""); setRoleFilter(""); }} className="text-blue-500 hover:text-blue-700 text-sm">Clear Filters</button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">Showing {filteredUsers.length} of {users.length} users</div>
      </div>

      {/* Reset Password Modal */}
      {resetPasswordId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Reset Password</h3>
            <p className="text-gray-600 mb-4">Enter a new password for this user:</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full border p-2 sm:p-3 rounded mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setResetPasswordId(null); setNewPassword(""); }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetPasswordId)}
                disabled={resetLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : filteredUsers.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center"><p className="text-gray-500">No users found.</p></div>
      ) : (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">S.No.</th>
                <th className="py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>Name{getSortIndicator("name")}</th>
                <th className="py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("email")}>Email{getSortIndicator("email")}</th>
                <th className="py-2">Mobile</th>
                <th className="py-2">Password</th>
                <th className="py-2">Role</th>
                <th className="py-2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("createdAt")}>Joined{getSortIndicator("createdAt")}</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b">
                  {editingId === user.id ? (
                    <>
                      <td className="py-2 text-center">{index + 1}</td>
                      <td className="py-2"><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="border p-1 w-full sm:w-32" /></td>
                      <td className="py-2"><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="border p-1 w-full sm:w-40" /></td>
                      <td className="py-2"><input type="tel" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} className="border p-1 w-full sm:w-28" /></td>
                      <td className="py-2 text-gray-400">-</td>
                      <td className="py-2"><span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">{user.role}</span></td>
                      <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <button onClick={() => saveEdit(user.id)} className="bg-green-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs mr-1">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 text-center">{index + 1}</td>
                      <td className="py-2">{user.name}</td>
                      <td className="py-2">{user.email}</td>
                      <td className="py-2">{user.mobile}</td>
                      <td className="py-2">
                        <span className="font-mono text-xs">{user.password || "-"}</span>
                      </td>
                      <td className="py-2"><span className={"px-2 py-1 text-xs rounded " + (user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{user.role}</span></td>
                      <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <button onClick={() => setResetPasswordId(user.id)} className="bg-orange-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs mr-1">Reset</button>
                        <button onClick={() => startEdit(user)} className="bg-blue-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs mr-1">Edit</button>
                        <button onClick={() => deleteUser(user.id)} className="bg-red-500 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


