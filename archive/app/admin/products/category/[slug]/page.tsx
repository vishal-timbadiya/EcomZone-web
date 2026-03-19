"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  productCode: string;
  name: string;
  imageUrl: string;
  singlePrice: number;
  stock: number;
  isActive: boolean;
  isBestseller: boolean;
  category: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export default function AdminCategoryProducts() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const fetchCategoryProducts = useCallback(async () => {
    if (!mounted) return;
    try {
      const token = localStorage.getItem('adminToken');
      const url = new URL(`/api/admin/categories/${slug}?page=${page}&limit=50`, window.location.origin);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching admin category products:', error);
    } finally {
      setLoading(false);
    }
  }, [slug, page, mounted]);

  useEffect(() => {
    setMounted(true);
    fetchCategoryProducts();
  }, [fetchCategoryProducts]);

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (data?.products) {
      if (selectedProducts.size === data.products.length) {
        setSelectedProducts(new Set());
      } else {
        setSelectedProducts(new Set(data.products.map((p: Product) => p.id)));
      }
    }
  };

  if (!mounted || loading) {
    return <div>Loading...</div>;
  }

  const { category, products, pagination } = data || {};

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/products" className="text-blue-600 hover:underline">
          ← Back to All Products
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          <h1 className="text-2xl font-bold">{category.name} Products</h1>
          <span className="text-sm text-gray-500">({products?.length || 0})</span>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <span className="font-medium">{selectedProducts.size} products selected</span>
          <button className="ml-4 px-3 py-1 bg-blue-600 text-white rounded text-sm">
            Bulk Actions
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-semibold">Product</th>
                <th className="p-4 text-left font-semibold">Code</th>
                <th className="p-4 text-left font-semibold">Price</th>
                <th className="p-4 text-left font-semibold">Stock</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: Product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleSelectProduct(product.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4">{product.productCode || '-'}</td>
                  <td className="p-4 font-mono">₹{product.singlePrice}</td>
                  <td className={`p-4 font-semibold ${
                    product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {product.stock}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Edit</button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="p-4 border-t flex justify-center gap-2">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`?page=${p}`}
                className={`px-3 py-2 rounded ${
                  p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

