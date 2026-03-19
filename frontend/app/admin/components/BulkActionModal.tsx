"use client";

import React, { useState } from 'react';

interface Product {
  id: string;
  name: string;
  isBestseller: boolean;
  isNewArrival: boolean;
  isTopRanking: boolean;
  isActive: boolean;
  stock: number;
  category: string;
  singlePrice: number;
}

interface BulkActionModalProps {
  selectedProducts: Product[];
  categories: string[];
  onClose: () => void;
  onSave: (changes: Partial<Product>) => Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
}


export default function BulkActionModal({ 
  selectedProducts, 
  categories,
  onClose, 
  onSave, 
  onDelete,
  onCancel 
}: BulkActionModalProps) {
  const [changes, setChanges] = useState<Partial<Product>>({
    isBestseller: false,
    isNewArrival: false,
    isTopRanking: false,
    isActive: true as boolean | undefined,
    stock: 0 as number | undefined,
    category: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(changes);
      onClose();
    } catch (error) {
      console.error("Bulk save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const previewChanges = (product: Product) => ({
    ...product,
    ...Object.fromEntries(
      Object.entries(changes).filter(([_, v]) => v !== undefined && v !== "")
    ),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Bulk Edit {selectedProducts.length} Products</h2>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Edit Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Product Tags</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={changes.isBestseller}
                    onChange={(e) => setChanges({...changes, isBestseller: e.target.checked})}
                    className="w-5 h-5 text-red-500 rounded"
                  />
                  <span className="font-medium text-red-700">Set as Bestseller</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={changes.isNewArrival}
                    onChange={(e) => setChanges({...changes, isNewArrival: e.target.checked})}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <span className="font-medium text-green-700">Set as New Arrival</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={changes.isTopRanking}
                    onChange={(e) => setChanges({...changes, isTopRanking: e.target.checked})}
                    className="w-5 h-5 text-purple-500 rounded"
                  />
                  <span className="font-medium text-purple-700">Set as Top Ranking</span>
                </label>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Quick Actions</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="status"
                    checked={changes.isActive}
                    onChange={(e) => setChanges({...changes, isActive: e.target.checked})}
                    className="w-5 h-5 text-green-500"
                  />
                  <span className="font-medium text-green-700">Active</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="status"
                    checked={!changes.isActive}
                    onChange={(e) => setChanges({...changes, isActive: !e.target.checked})}
                    className="w-5 h-5 text-red-500"
                  />
                  <span className="font-medium text-red-700">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          {/* Number Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                <input 
                  type="number" 
                  value={changes.stock ?? ''}
                  onChange={(e) => setChanges({...changes, stock: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new stock value"
                />
            </div>

          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
<select
              value={changes.category}
              onChange={(e) => setChanges({...changes, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Keep current category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Preview Table */}
          <div>
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <span>Preview Changes ({selectedProducts.length} products)</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.slice(0, 5).map((product, idx) => {
                    const preview = previewChanges(product);
                    return (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.isBestseller ? '⭐ Bestseller' : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            preview.isBestseller 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {preview.isBestseller ? '⭐ Bestseller' : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {selectedProducts.length > 5 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        ... and {selectedProducts.length - 5} more products
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Saving..." : `Update ${selectedProducts.length} Products`}
              </button>
              <button
                onClick={onDelete}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
              >
                Delete {selectedProducts.length} Products
              </button>
            </div>
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

