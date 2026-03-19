"use client"

import React, { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string;
  position?: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    imageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken");
      const url = editingId 
        ? `/api/admin/categories/update/${editingId}`
        : '/api/admin/categories';
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const wasEditing = !!editingId;
        setFormData({ name: '', icon: '📦', imageUrl: '' });
        setImagePreview('');
        setEditingId(null);
        fetchCategories();
        alert(wasEditing ? 'Category updated!' : 'Category created!');
      } else {
        const error = await res.json();
        alert(error.error || 'Error saving category');
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData({ ...formData, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon,
      imageUrl: category.imageUrl || ''
    });
    setImagePreview(category.imageUrl || '');
    setEditingId(category.id);
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/categories/update/${id}`, {
        method: 'POST',
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, direction })
      });

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error moving category:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!confirm(isActive ? 'Deactivate this category?' : 'Activate this category?')) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/categories/update/${id}/toggle`, {
        method: 'PATCH',
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Error toggling category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category permanently?')) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/categories/update/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse bg-white rounded-xl shadow-md p-8">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Categories</h1>
          <p className="text-slate-600">Manage your product categories</p>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg"
                placeholder="Enter category name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Icon Emoji
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 text-2xl"
                placeholder="📦"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category Image
              </label>
              <div className="flex gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {saving ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingId ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingId ? (
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">All Categories</h2>
                <p className="text-slate-600">{categories.length} total categories</p>
              </div>
              <div className="text-sm text-slate-500">
                Sort by: <span className="font-semibold text-slate-800">Newest</span>
              </div>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-3xl flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No categories yet</h3>
              <p className="text-slate-600 mb-6">Create your first category above</p>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', icon: '📦', imageUrl: '' });
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-4 text-left font-semibold text-slate-700">Icon</th>
                    <th className="px-8 py-4 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-8 py-4 text-left font-semibold text-slate-700">Slug</th>
                    <th className="px-8 py-4 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-8 py-4 text-left font-semibold text-slate-700">Created</th>
                    <th className="w-48 px-8 py-4 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {category.imageUrl ? (
                            <img src={category.imageUrl} alt={category.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-semibold text-slate-800">{category.name}</td>
                      <td className="px-8 py-6 text-slate-600 font-mono text-sm bg-slate-100/50 rounded px-3 py-1">
                        /{category.slug}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-600">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleMove(category.id, 'up')}
                            className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold hover:bg-sky-200 transition-all"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMove(category.id, 'down')}
                            className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold hover:bg-sky-200 transition-all"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleToggleActive(category.id, category.isActive)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                              category.isActive 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

