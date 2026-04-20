"use client"

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react"

type StatusTab = "all" | "lowStock" | "outOfStock" | "recentlyAdded" | "bestseller" | "newArrival"

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [stats, setStats] = useState({
    all: 0,
    lowStock: 0,
    outOfStock: 0,
    recentlyAdded: 0,
    bestseller: 0,
    newArrival: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [activeTab, setActiveTab] = useState<StatusTab>("all")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedCategory, setSelectedCategory] = useState("")

  const totalPages = Math.ceil(products.length / pageSize)
  
  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Modals
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [zipProcessed, setZipProcessed] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Real API call
      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${apiUrl}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/categories`)
      ])
      
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
        
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        setStats({
          all: data.products?.length || 0,
          lowStock: data.products?.filter((p: any) => p.stock > 0 && p.stock < 10).length || 0,
          outOfStock: data.products?.filter((p: any) => p.stock === 0).length || 0,
          recentlyAdded: data.products?.filter((p: any) => new Date(p.createdAt) > sevenDaysAgo).length || 0,
          bestseller: data.products?.filter((p: any) => p.isBestseller).length || 0,
          newArrival: data.products?.filter((p: any) => p.isNewArrival).length || 0
        })
      }

      if (categoriesRes.ok) {
        const cats = await categoriesRes.json()
        setCategories(cats || [])
      }
    } catch (error) {
      console.error("Load failed", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products
    .filter(p => activeTab === "all" || 
      (activeTab === "lowStock" && p.stock > 0 && p.stock < 10) ||
      (activeTab === "outOfStock" && p.stock === 0) ||
      (activeTab === "bestseller" && p.isBestseller) ||
      (activeTab === "newArrival" && p.isNewArrival))
    .filter(p => !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.productCode.includes(search))
    .filter(p => !selectedCategory || p.category === selectedCategory || p.categories.includes(selectedCategory))
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map((p: any) => p.id)))
    }
  }

  const openEdit = (product: any) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const saveProduct = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const url = editingProduct?.id 
        ? `${apiUrl}/admin/products/${editingProduct.id}`
        : `${apiUrl}/admin/products`
      
      const res = await fetch(url, {
        method: editingProduct?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProduct)
      })

      if (res.ok) {
        setShowProductForm(false)
        setEditingProduct(null)
        loadData()
      }
    } catch (error) {
      alert('Save failed')
    }
  }

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} products?`)) return
    
    try {
      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await fetch(`${apiUrl}/admin/products/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productIds: Array.from(selectedIds) })
      })
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      alert('Delete failed')
    }
  }

  const handleBulkCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/admin/products/bulk-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        // Show preview
        alert(`${data.products?.length || 0} products ready for import`)
        loadData()
      }
    } catch (error) {
      alert('Import failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xl font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-12 gap-2 sm:gap-4 md:gap-6">
          <div className="animate-fade-in">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent drop-shadow-lg mb-2">
              🛍️ Products
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mt-2 sm:mt-3 max-w-xs sm:max-w-md leading-relaxed">Complete inventory management with advanced bulk operations and real-time analytics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 animate-slide-up w-full sm:w-auto">
            <button
              onClick={() => setShowProductForm(true)}
              className="group flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:scale-105"
            >
              <span className="group-hover:rotate-12 transition-transform">➕</span>
              <span className="hidden sm:inline">Add New Product</span>
              <span className="sm:hidden">Add</span>
            </button>
            
            <button
              onClick={() => setShowBulkImport(true)}
              className="group flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base md:text-lg cursor-pointer flex items-center justify-center gap-2 sm:gap-3 hover:scale-105"
            >
              <span className="group-hover:bounce transition-transform">📤</span>
              <span className="hidden sm:inline">Bulk Import</span>
              <span className="sm:hidden">Import</span>
            </button>
            
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="group flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white font-bold rounded-3xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base md:text-lg hover:scale-105"
              >
                <span className="group-hover:shake transition-transform">🗑️</span>
                Delete {selectedIds.size}
              </button>
            )}
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {[
            { title: 'Total Products', value: stats.all, color: 'blue', icon: '📦', gradient: 'from-blue-500 to-indigo-600' },
            { title: 'Low Stock Alert', value: stats.lowStock, color: 'yellow', icon: '⚠️', gradient: 'from-yellow-500 to-orange-500' },
            { title: 'Out of Stock', value: stats.outOfStock, color: 'red', icon: '🚫', gradient: 'from-red-500 to-rose-500' },
            { title: 'New Arrivals', value: stats.newArrival, color: 'emerald', icon: '✨', gradient: 'from-emerald-500 to-teal-500' }
          ].map(({ title, value, color, icon, gradient }, index) => (
            <div key={index} className="group bg-white/80 backdrop-blur-xl p-3 sm:p-4 md:p-6 lg:p-8 rounded-3xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-200 animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className={`p-4 bg-gradient-to-br ${gradient} rounded-3xl shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl group-hover:animate-bounce">{icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider group-hover:text-gray-800 transition-colors">{title}</p>
                  <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 group-hover:text-gray-950 transition-colors">{value.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`} 
                     style={{width: title === 'Total Products' ? '100%' : `${Math.min((value / stats.all) * 100, 100)}%`}}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl border border-white/50 mb-8 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Search Products</label>
              <input
                type="text"
                placeholder="Name, code, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-inner transition-all duration-300 text-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Quick Filters</label>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as StatusTab)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-inner transition-all duration-300 text-lg"
              >
                <option value="all">All Products</option>
                <option value="lowStock">Low Stock (1-9)</option>
                <option value="outOfStock">Out of Stock</option>
                <option value="bestseller">Bestsellers</option>
                <option value="newArrival">New Arrivals</option>
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-3">Advanced Filters</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-inner transition-all duration-300 text-xs sm:text-sm md:text-base lg:text-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name} ({cat.productCount})</option>
                  ))}
                </select>
                <select className="flex-1 px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-inner transition-all text-xs sm:text-sm md:text-base lg:text-lg">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fade-in-up" style={{animationDelay: '400ms'}}>
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-2 sm:gap-3 md:gap-4">
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <span className="animate-pulse">📊</span>
                Product Inventory ({filteredProducts.length})
              </h3>
              {selectedIds.size > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-white/20 p-3 sm:p-4 rounded-2xl backdrop-blur-sm border border-white/30 animate-pulse w-full sm:w-auto">
                  <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg">{selectedIds.size} Selected</span>
                  <button 
                    onClick={() => setShowBulkActions(true)}
                    className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-xs sm:text-sm md:text-base whitespace-nowrap"
                  >
                    ⚡ Bulk Edit
                  </button>
                  <button 
                    onClick={deleteSelected}
                    className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-xs sm:text-sm md:text-base whitespace-nowrap"
                  >
                    🗑️ Delete All
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                <tr>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 w-12 sm:w-16 text-center text-xs sm:text-sm md:text-base">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Product Information</th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Pricing Details</th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Stock & Inventory</th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Categories</th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Status</th>
                  <th className="p-2 sm:p-3 md:p-4 lg:p-6 font-bold text-gray-900 text-xs sm:text-sm md:text-base">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md animate-fade-in-up border-b border-gray-50" style={{animationDelay: `${index * 50}ms`}}>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <div className="relative group">
                          {product.imageUrl ? (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg overflow-hidden hover:scale-110 transition-transform duration-300">
                              <img
                                src={getAbsoluteImageUrl(product.imageUrl)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const next = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (next) next.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center text-white font-bold text-lg group-hover:animate-pulse hidden">
                                {product.productCode.slice(-3)}
                              </div>
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300">
                              <span className="text-white font-bold text-lg group-hover:animate-pulse">{product.productCode.slice(-3)}</span>
                            </div>
                          )}
                          {product.imageUrls.length > 1 && (
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border-4 border-white animate-bounce">
                              <span className="text-xs font-bold text-gray-600">+{product.imageUrls.length - 1}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm md:text-lg text-gray-900 mb-1 leading-tight">{product.name}</h4>
                          <p className="text-xs sm:text-xs md:text-sm text-gray-600 mb-2">{product.productCode}</p>
                          <div className="flex flex-wrap gap-1">
                            {product.isBestseller && <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">⭐ Bestseller</span>}
                            {product.isNewArrival && <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-full">✨ New</span>}
                            {product.isTopRanking && <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full">🏆 Top</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className="space-y-2">
                        <div className="font-bold text-xs sm:text-sm md:text-lg">₹{product.singlePrice.toLocaleString()}</div>
                        <div className="text-xs sm:text-sm md:text-base text-gray-700">
                          Carton: <span className="font-bold">{product.cartonQty}</span> pcs
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1 flex-wrap">
                          Carton Pcs: ₹{product.cartonPcsPrice.toLocaleString()}
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                            GST {product.gstPercentage}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-4 h-4 rounded-full ${
                          product.stock >= 50 ? 'bg-emerald-500' :
                          product.stock >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className={`font-bold text-xs sm:text-sm md:text-lg ${
                            product.stock >= 50 ? 'text-emerald-700' :
                            product.stock >= 10 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {product.stock.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">{product.weight}g</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className="space-y-1">
                        <span className="block px-2 sm:px-3 py-1 sm:py-2 bg-indigo-100 text-indigo-800 font-semibold rounded-xl text-xs sm:text-sm">
                          {product.category}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.categories.slice(0, 3).map((cat: string) => (
                            <span key={cat} className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-lg font-medium">
                              {cat}
                            </span>
                          ))}
                          {product.categories.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-lg">
                              +{product.categories.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className={`px-2 sm:px-4 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold ${
                        product.isActive
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-2 border-emerald-200 shadow-md'
                          : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-200 shadow-md'
                      }`}>
                        {product.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 md:p-4 lg:p-6">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="group flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-xs sm:text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:scale-105 whitespace-nowrap"
                        >
                          <span className="group-hover:rotate-12 inline-block mr-1">✏️</span>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${product.name}"?`)) {
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                              fetch(`${apiUrl}/admin/products/${product.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem("adminToken")}`
                                }
                              })
                              .then(res => {
                                if (res.ok) {
                                  loadData()
                                } else {
                                  alert('Delete failed')
                                }
                              })
                              .catch(err => alert('Delete failed'))
                            }
                          }}
                          className="group flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-2xl text-xs sm:text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:scale-105 whitespace-nowrap"
                        >
                          <span className="group-hover:animate-bounce inline-block mr-1">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* No results */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 sm:py-16 md:py-24">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">📦</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">No products found</h3>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 max-w-xs sm:max-w-md mx-auto">
                {search ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
              </p>
              <button
                onClick={() => openEdit(null)}
                className="px-6 sm:px-8 md:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-3xl text-xs sm:text-base md:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                ➕ Add First Product
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="border-t bg-gradient-to-r from-slate-50 to-gray-50 p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, products.length)} of {products.length} results
                  </div>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                  >
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-2xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => currentPage - 2 + i).filter(p => p >= 1 && p <= totalPages).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-4 py-2 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                          page === currentPage
                            ? 'bg-blue-600 text-white shadow-md hover:shadow-lg'
                            : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-2xl text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Next →
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
          onSave={() => {
            setShowProductForm(false)
            setEditingProduct(null)
            loadData()
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImport={loadData}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkActions && selectedIds.size > 0 && (
        <BulkEditModal
          selectedIds={Array.from(selectedIds)}
          categories={categories}
          onClose={() => setShowBulkActions(false)}
          onSave={() => {
            setShowBulkActions(false)
            setSelectedIds(new Set())
            loadData()
          }}
        />
      )}
    </div>
  )
}

// Helper function to ensure image URLs are absolute
function getAbsoluteImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // If it's a relative URL like /uploads/..., prepend the backend URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const backendUrl = apiUrl.replace(/\/api$/, '');
  return `${backendUrl}${url}`;
}

function ProductFormModal({ product, categories, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    productCode: product?.productCode || '',
    name: product?.name || '',
    description: product?.description || '',
    singlePrice: Number(product?.singlePrice) || 0,
    cartonPcsPrice: Number(product?.cartonPcsPrice) || 0,
    cartonPrice: Number(product?.cartonPrice) || 0,
    cartonQty: Number(product?.cartonQty) || 1,
    gstPercentage: Number(product?.gstPercentage) || 18,
    hsnCode: product?.hsnCode || '',
    weight: Number(product?.weight) || 0.1,
    stock: Number(product?.stock) || 100,
    category: product?.category || (categories.length > 0 ? categories[0].slug : ''),
    subCategory: product?.subCategory || 'basic',
    isBestseller: product?.isBestseller || false,
    isNewArrival: product?.isNewArrival || false,
    isTopRanking: product?.isTopRanking || false,
    isActive: product?.isActive !== false,
    imageUrl: product?.imageUrl || '',
    imageUrls: product?.imageUrls || []
  })

  const [isInitialized, setIsInitialized] = useState(false)

  // Reset form when product changes (modal opens with different product)
  const resetForm = () => {
    setFormData({
      productCode: product?.productCode || '',
      name: product?.name || '',
      description: product?.description || '',
      singlePrice: Number(product?.singlePrice) || 0,
      cartonPcsPrice: Number(product?.cartonPcsPrice) || 0,
      cartonPrice: Number(product?.cartonPrice) || 0,
      cartonQty: Number(product?.cartonQty) || 1,
      gstPercentage: Number(product?.gstPercentage) || 18,
      hsnCode: product?.hsnCode || '',
      weight: Number(product?.weight) || 0.1,
      stock: Number(product?.stock) || 100,
      category: product?.category || (categories.length > 0 ? categories[0].slug : ''),
      subCategory: product?.subCategory || 'basic',
      isBestseller: product?.isBestseller || false,
      isNewArrival: product?.isNewArrival || false,
      isTopRanking: product?.isTopRanking || false,
      isActive: product?.isActive !== false,
      imageUrl: product?.imageUrl || '',
      imageUrls: product?.imageUrls || []
    })
    setIsInitialized(true)
  }

  // Initialize form data only once when modal opens
  useEffect(() => {
    if (!isInitialized) {
      resetForm()
    }
  }, [isInitialized])

  // Reset when product changes
  useEffect(() => {
    setIsInitialized(false)
  }, [product?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate only essential required fields
    if (!formData.name || !formData.name.trim()) {
      alert('Product name is required')
      return
    }

    // For new products, require at least one image
    if (!product?.id && !formData.imageUrl && (!formData.imageUrls || formData.imageUrls.length === 0)) {
      alert('At least one product image is required for new products')
      return
    }
    
    try {
      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const url = product?.id 
        ? `${apiUrl}/admin/products/${product.id}`
        : `${apiUrl}/admin/products`
      
      const res = await fetch(url, {
        method: product?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
       body: JSON.stringify({
          ...formData,
          singlePrice: Number(formData.singlePrice) || 0,
          cartonPcsPrice: Number(formData.cartonPcsPrice) || 0,
          cartonQty: Number(formData.cartonQty) || 1,
          gstPercentage: Number(formData.gstPercentage) || 0,
          weight: Number(formData.weight) || 0,
          stock: Number(formData.stock) || 0
        })
      })

      if (res.ok) {
        onSave()
      } else {
        try {
          const error = await res.json()
          alert(`Save failed: ${error.message || 'Unknown error'}`)
        } catch {
          alert(`Save failed: ${res.status} ${res.statusText}`)
        }
      }
    } catch (error) {
      alert('Save failed: Network error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-8 border-b">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Product Code</label>
              <input
                type="text"
                value={formData.productCode || ''}
                onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Single Price (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.singlePrice ?? ''}
                onChange={(e) => setFormData({...formData, singlePrice: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Carton Pcs Price (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.cartonPcsPrice ?? ''}
                onChange={(e) => {
                  const cartonPcsPrice = e.target.value === '' ? 0 : parseFloat(e.target.value)
                  const cartonPrice = (typeof cartonPcsPrice === 'number' ? cartonPcsPrice : 0) * (Number(formData.cartonQty) || 1)
                  setFormData({...formData, cartonPcsPrice, cartonPrice})
                }}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
              />
              <p className="text-xs text-gray-500 mt-2">Price per piece in a carton</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Carton Qty</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.cartonQty ?? ''}
                onChange={(e) => {
                  const cartonQty = e.target.value === '' ? 1 : parseInt(e.target.value)
                  const cartonPrice = (Number(formData.cartonPcsPrice) || 0) * (typeof cartonQty === 'number' ? cartonQty : 1)
                  setFormData({...formData, cartonQty, cartonPrice})
                }}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
              />
              <p className="text-xs text-gray-500 mt-2">Units per carton</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">📊 Carton Total Price (Auto-calculated)</p>
            <p className="text-2xl font-bold text-blue-600">₹{(Number(formData.cartonPrice) || 0).toFixed(2)}</p>
            <p className="text-xs text-blue-700 mt-1">= {Number(formData.cartonPcsPrice) || 0} × {Number(formData.cartonQty) || 1}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">GST %</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.gstPercentage ?? ''}
                onChange={(e) => setFormData({...formData, gstPercentage: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">HSN Code</label>
              <input
                type="text"
                value={formData.hsnCode || ''}
                onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Weight (grams)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.weight ?? ''}
                onChange={(e) => setFormData({...formData, weight: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stock ?? ''}
                onChange={(e) => setFormData({...formData, stock: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                onWheel={(e) => {e.preventDefault(); e.currentTarget.blur();}}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Sub Category</label>
              <input
                type="text"
                value={formData.subCategory || ''}
                onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Product Images *</label>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-3">Primary Image *</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const uploadData = new FormData()
                        uploadData.append('file', file)
                        
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                        const uploadUrl = apiUrl.replace(/\/api$/, '') + '/api/upload';
                        fetch(uploadUrl, {
                          method: 'POST',
                          body: uploadData
                        })
                        .then(res => {
                          if (!res.ok) {
                            throw new Error(`Upload failed with status ${res.status}`);
                          }
                          return res.json();
                        })
                        .then(data => {
                          // Use full URL if available, otherwise construct it using helper
                          const imageUrl = data.fullUrl || getAbsoluteImageUrl(data.url);
                          if (imageUrl) {
                            setFormData(prev => ({...prev, imageUrl}));
                          } else {
                            alert('No URL returned from upload');
                          }
                        })
                        .catch(err => {
                          console.error('Primary image upload error:', err);
                          alert(`Image upload failed: ${err.message}`);
                        })
                      }
                    }}
                    className="hidden"
                    id="primaryImageInput"
                  />
                  <label
                    htmlFor="primaryImageInput"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer flex items-center gap-2"
                  >
                    📷 Insert Primary Image
                  </label>
                  {formData.imageUrl && (
                    <div className="relative group">
                      <img src={getAbsoluteImageUrl(formData.imageUrl)} alt="Primary" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-4 border-blue-200 shadow-lg hover:scale-110 transition-transform duration-300" />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-3">Additional Images</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        const uploadPromises = files.map(file => {
                          const formData = new FormData()
                          formData.append('file', file)
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                          const uploadUrl = apiUrl.replace(/\/api$/, '') + '/api/upload';
                          return fetch(uploadUrl, {
                            method: 'POST',
                            body: formData
                          }).then(res => {
                            if (!res.ok) {
                              throw new Error(`Upload failed with status ${res.status}`);
                            }
                            return res.json();
                          })
                        })

                        Promise.all(uploadPromises)
                        .then(results => {
                          const urls = results.filter(r => r.fullUrl || r.url).map(r => r.fullUrl || getAbsoluteImageUrl(r.url))
                          if (urls.length > 0) {
                            setFormData(prev => ({...prev, imageUrls: [...(prev.imageUrls || []), ...urls]}))
                          } else {
                            alert('No URLs returned from upload');
                          }
                        })
                        .catch(err => {
                          console.error('Additional images upload error:', err);
                          alert(`Image upload failed: ${err.message}`);
                        })
                      }
                    }}
                    className="hidden"
                    id="additionalImagesInput"
                  />
                  <label
                    htmlFor="additionalImagesInput"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer flex items-center gap-2"
                  >
                    🖼️ Insert Additional Images
                  </label>
                </div>
                {(formData.imageUrls && formData.imageUrls.length > 0) && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-3">Additional Image Preview ({formData.imageUrls.length} images):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.imageUrls.map((url: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={getAbsoluteImageUrl(url)}
                            alt={`Image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl border-4 border-gray-200 shadow-lg hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = (formData.imageUrls || []).filter((_: any, i: number) => i !== index)
                              setFormData({...formData, imageUrls: newUrls})
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isBestseller}
                onChange={(e) => setFormData({...formData, isBestseller: e.target.checked})}
              />
              <span className="text-sm font-medium">Bestseller</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({...formData, isNewArrival: e.target.checked})}
              />
              <span className="text-sm font-medium">New Arrival</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isTopRanking}
                onChange={(e) => setFormData({...formData, isTopRanking: e.target.checked})}
              />
              <span className="text-sm font-medium">Top Ranking</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 sm:px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transition-all text-sm sm:text-base"
            >
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkImportModal({ onClose, onImport }: any) {
  const [importType, setImportType] = useState<'csv' | 'zip'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [zipProcessed, setZipProcessed] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [csvDownloadUrl, setCsvDownloadUrl] = useState<string>('')
  const [csvSessionId, setCsvSessionId] = useState<string>('')
  const [isZipCsvUpload, setIsZipCsvUpload] = useState(false)
  const [completionStats, setCompletionStats] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(null)
      // Detect if this is a CSV upload after ZIP processing (Step 6)
      if (zipProcessed && selectedFile.name.endsWith('.csv')) {
        setIsZipCsvUpload(true)
        // Auto-show success that file is ready
        console.log('Step 6: CSV file selected for upload after ZIP processing')
      } else if (selectedFile.name.endsWith('.csv') && !zipProcessed) {
        setIsZipCsvUpload(false)
        console.log('Direct CSV import selected')
      } else {
        setIsZipCsvUpload(false)
        console.log('ZIP file selected')
      }
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', isZipCsvUpload ? 'csv' : importType)

      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      console.log('Preview starting:', {
        fileName: file.name,
        fileSize: file.size,
        importType: isZipCsvUpload ? 'csv' : importType,
        tokenExists: !!token
      });

      const res = await fetch(`${apiUrl}/admin/products/bulk-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      console.log('Preview response:', {
        status: res.status,
        contentType: res.headers.get('content-type')
      });

      if (res.ok) {
        const data = await res.json()
        console.log('Preview data received:', data);
        setPreview(data)
      } else {
        const contentType = res.headers.get('content-type');
        let errorData;
        
        if (contentType?.includes('application/json')) {
          errorData = await res.json().catch(() => ({}));
        } else {
          const text = await res.text();
          console.error('Non-JSON error response:', text);
          errorData = { error: `Server error: ${res.status}` };
        }

        console.error('Preview error:', errorData);

        // Build detailed error message
        let errorMessage = errorData.error || 'Preview failed'

        if (errorData.issues && errorData.issues.length > 0) {
          errorMessage += '\n\n❌ Issues found:'
          errorData.issues.slice(0, 5).forEach((issue: any) => {
            errorMessage += `\n\nRow ${issue.row} - ${issue.productName}:`
            if (Array.isArray(issue.errors)) {
              issue.errors.forEach((err: string) => {
                errorMessage += `\n  • ${err}`
              })
            }
          })
          if (errorData.issues.length > 5) {
            errorMessage += `\n\n... and ${errorData.issues.length - 5} more rows`
          }
        }

        if (errorData.totalRows > 0 && errorData.validRows !== undefined) {
          errorMessage += `\n\nSummary: ${errorData.validRows} valid out of ${errorData.totalRows} rows`
        }

        // Show detailed error
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Preview error:', error)
      console.error('Error details:', error.message);
      alert(`Preview failed: ${error.message || 'Network error. Check console for details.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview?.products || preview.products.length === 0) return

    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      
      if (!token) {
        alert('No admin token found. Please login again.')
        setLoading(false)
        return
      }

      // Use bulk-upsert for CSV uploaded after ZIP processing, bulk-save for regular CSV
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const endpoint = isZipCsvUpload ? `${apiUrl}/admin/products/bulk-upsert` : `${apiUrl}/admin/products/bulk-save`
      
      console.log('Import starting:');
      console.log('  Endpoint:', endpoint);
      console.log('  Token exists:', !!token);
      console.log('  Product count:', preview.products.length);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: preview.products })
      })

      console.log('Response received:');
      console.log('  Status:', res.status);
      console.log('  Content-Type:', res.headers.get('content-type'));

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        let data;
        
        if (contentType?.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error('Non-JSON response received:', text);
          throw new Error(`Expected JSON but received ${contentType}: ${text.substring(0, 200)}`);
        }

        console.log('Import successful:', data);

        // Show completion stats for both ZIP and regular CSV imports
        setCompletionStats({
          added: data.added || 0,
          updated: data.updated || 0,
          total: data.processed || (data.added || 0) + (data.updated || 0) || preview.products.length || 0,
          errors: Array.isArray(data.errors) ? data.errors.filter((e: any) => typeof e === 'string') : [],
          message: data.message || `Successfully imported ${data.added || data.success || 0} products`
        })
      } else {
        const contentType = res.headers.get('content-type');
        let errorData;
        
        console.log('Request failed with status:', res.status);
        
        if (contentType?.includes('application/json')) {
          errorData = await res.json().catch(() => ({}));
          console.log('Error JSON:', errorData);
        } else {
          const text = await res.text();
          console.error(`Server returned ${res.status} with non-JSON response (${contentType}):`, text.substring(0, 500));
          errorData = { error: `Server error: ${res.status} - ${text.substring(0, 100)}` };
        }
        
        alert(`Import failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Import error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Import failed: ${error.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleZipImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem("adminToken")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/admin/products/bulk-folder-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setZipProcessed(true)
        setCsvSessionId(data.csvSessionId || '')
        setCsvDownloadUrl(data.csvDownloadUrl || '')
        setFile(null) // Reset file for next upload
        alert(`✅ ZIP processed successfully!\n\nFound and extracted ${data.count} products with images.\n\nStep 3: Click "Download CSV Template" to get the pre-filled CSV with product codes and image URLs.`)
      } else {
        const error = await res.json().catch(() => ({}))
        alert(`ZIP processing failed: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('ZIP import error:', error)
      alert('ZIP processing failed: Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-8 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Import Products</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Workflow Progress Indicator */}
          {!completionStats && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              {/* Step 1: Method Selection */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  importType ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-xs font-semibold text-gray-700">Method</span>
              </div>

              {/* Arrow */}
              <div className="text-gray-400 text-lg mb-6">→</div>

              {/* Step 2: File Upload */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  file ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-xs font-semibold text-gray-700">{importType === 'zip' ? 'Upload ZIP' : 'Upload CSV'}</span>
              </div>

              {/* Arrow */}
              <div className="text-gray-400 text-lg mb-6">→</div>

              {/* Step 3: CSV Processing/Download */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  zipProcessed || (file && importType === 'csv') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                <span className="text-xs font-semibold text-gray-700">{importType === 'zip' ? 'Download CSV' : 'Preview'}</span>
              </div>

              {/* Arrow */}
              <div className="text-gray-400 text-lg mb-6">→</div>

              {/* Step 4: Preview & Review */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  preview ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  4
                </div>
                <span className="text-xs font-semibold text-gray-700">Review</span>
              </div>

              {/* Arrow */}
              <div className="text-gray-400 text-lg mb-6">→</div>

              {/* Step 5: Finish */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  completionStats ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  5
                </div>
                <span className="text-xs font-semibold text-gray-700">Finish</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-8">
          {/* Completion Stats */}
          {completionStats && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8 shadow-2xl">
                {/* Success Header */}
                <div className="text-center mb-10">
                  <div className="mb-4 inline-block">
                    <div className="text-8xl animate-pulse" style={{ animationDuration: '1.5s' }}>
                      ✅
                    </div>
                  </div>
                  <h3 className="text-4xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Import Completed Successfully!
                  </h3>
                  <p className="text-green-700 text-lg font-semibold max-w-2xl mx-auto">
                    {completionStats.message}
                  </p>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  {/* Added Products Card */}
                  <div className="group bg-white rounded-3xl p-8 text-center border-2 border-green-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full opacity-10 blur-xl"></div>
                      <div className="relative text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
                        ➕
                      </div>
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-green-600 mb-2">{completionStats.added}</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">New Products Added</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                      <span>✨</span>
                      <span>Fresh entries in database</span>
                    </div>
                  </div>

                  {/* Updated Products Card */}
                  <div className="group bg-white rounded-3xl p-8 text-center border-2 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full opacity-10 blur-xl"></div>
                      <div className="relative text-6xl group-hover:scale-110 transition-transform duration-300">
                        🔄
                      </div>
                    </div>
                    <div className="text-5xl font-black text-blue-600 mb-2">{completionStats.updated}</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">Products Updated</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                      <span>🎯</span>
                      <span>Matched & replaced</span>
                    </div>
                  </div>

                  {/* Total Processed Card */}
                  <div className="group bg-white rounded-3xl p-8 text-center border-2 border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-10 blur-xl"></div>
                      <div className="relative text-6xl group-hover:scale-110 transition-transform duration-300">
                        📦
                      </div>
                    </div>
                    <div className="text-5xl font-black text-purple-600 mb-2">{completionStats.total}</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">Total Processed</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-2">
                      <span>🎊</span>
                      <span>All products handled</span>
                    </div>
                  </div>
                </div>

                {/* Success Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">Success Rate</span>
                    <span className="text-sm font-bold text-green-600">100%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* Error Section - if any */}
                {completionStats.errors && completionStats.errors.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚠️</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-red-900 mb-3">⚠️ Found {completionStats.errors.length} Issue{completionStats.errors.length !== 1 ? 's' : ''}</h4>
                        <div className="text-sm text-red-800 max-h-32 overflow-y-auto space-y-2 bg-white p-3 rounded-lg">
                          {completionStats.errors.map((err: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      setCompletionStats(null)
                      setPreview(null)
                      setFile(null)
                      onImport()
                      onClose()
                    }}
                    className="group flex-1 min-w-[200px] px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all hover:scale-105 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
                  >
                    <span className="text-xl group-hover:animate-bounce">✅</span>
                    <span>All Done!</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2"
                  >
                    <span>📋</span>
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {/* Bottom Divider */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={onClose}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!completionStats && (
            <>
          {/* Import Type Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Choose Import Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                importType === 'csv' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="csv"
                  checked={importType === 'csv'}
                  onChange={(e) => setImportType(e.target.value as 'csv')}
                  className="sr-only"
                />
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <div className={`w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-xl sm:text-2xl ${
                    importType === 'csv' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    📊
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-lg text-gray-900">CSV Import</h4>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      Upload a CSV file with complete product data including images URLs.
                    </p>
                  </div>
                </div>
                {importType === 'csv' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </label>

              <label className={`relative cursor-pointer rounded-2xl border-2 p-4 sm:p-6 transition-all ${
                importType === 'zip' 
                  ? 'border-purple-500 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="zip"
                  checked={importType === 'zip'}
                  onChange={(e) => setImportType(e.target.value as 'zip')}
                  className="sr-only"
                />
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <div className={`w-10 sm:w-12 h-10 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-xl sm:text-2xl ${
                    importType === 'zip' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    📦
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-lg text-gray-900">ZIP with Images</h4>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      Upload product images in folders, then fill details in generated CSV.
                    </p>
                  </div>
                </div>
                {importType === 'zip' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Step-by-step guide for ZIP import */}
          {importType === 'zip' && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">📋</span>
                How ZIP Import Works
              </h4>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Prepare folders named by product codes (e.g., "PROD001", "PROD002")</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>Put product images in each folder (first image becomes primary)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>ZIP the folders and upload here</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                  <span>Download the generated CSV template</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                  <span>Fill in product details (name, price, description, etc.)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">6</span>
                  <span>Upload the completed CSV and import products</span>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section - ENHANCED Step 6 UI */}
          {importType === 'zip' && zipProcessed && (
            <div className="mb-8">
              {/* Success Alert - CSV Generated */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✅</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-emerald-900 mb-2">ZIP Processing Complete!</h4>
                    <p className="text-emerald-800 mb-3">Your images have been extracted and organized. Next steps:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-800">
                      <li><strong>Download the CSV</strong> - Click the download button below to get the template with product codes pre-filled</li>
                      <li><strong>Edit the CSV</strong> - Open in Excel/Google Sheets and fill in: Name, Price, Description, Category, GST %, etc.</li>
                      <li><strong>Upload the CSV</strong> - Upload your completed CSV file back here</li>
                      <li><strong>Review & Confirm</strong> - Check the preview of all products before final import</li>
                      <li><strong>Finish</strong> - Click Import to create all products instantly</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* CSV Download Button - Prominent */}
              {csvDownloadUrl && (
                <div className="mb-8 text-center">
                  <button
                    onClick={() => {
                      if (csvDownloadUrl) {
                        // Download by navigating to the URL
                        const link = document.createElement('a')
                        link.href = csvDownloadUrl
                        link.download = 'products-template.csv'
                        link.target = '_blank'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }
                    }}
                    className="inline-flex items-center gap-2 px-12 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all hover:scale-105 shadow-lg hover:shadow-2xl text-lg"
                  >
                    <span className="text-2xl">📥</span>
                    <span>Download CSV Template</span>
                  </button>
                  <p className="text-sm text-gray-600 mt-3">Product codes and image URLs are already filled in</p>
                </div>
              )}

              {/* Step 6 Header with Badge */}
              <div className="flex items-center gap-3 mb-6 border-t-2 border-gray-200 pt-8">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                  6
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Upload Completed CSV</h3>
                  <p className="text-sm text-gray-600">Final step: Upload your filled CSV to import products</p>
                </div>
              </div>

              {/* File Upload Area - Premium Design - Step 6 CSV Upload */}
              <div className="relative mb-6">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csvEditedFileInput"
                />
                <label htmlFor="csvEditedFileInput" className="cursor-pointer block">
                  <div className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                    file && isZipCsvUpload
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}>

                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 rounded-3xl opacity-5" style={{
                      backgroundImage: 'linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%)',
                      animation: 'pulse 3s ease-in-out infinite'
                    }}></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {!file || !isZipCsvUpload ? (
                        <>
                          {/* Upload Icon Animation */}
                          <div className="mb-4 inline-block">
                            <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
                              📤
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-2">Drop your CSV file here</p>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            or click to select the completed CSV file with all your product details filled in
                          </p>
                          <div className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg">
                            <span>📂 Choose CSV File</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* File Selected State */}
                          <div className="mb-4">
                            <div className="text-6xl animate-spin" style={{ animationDuration: '3s' }}>
                              ✅
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-green-700 mb-2">File Selected!</p>
                          <div className="bg-white border-2 border-green-300 rounded-xl p-4 mb-4 inline-block max-w-sm">
                            <p className="text-sm text-gray-600 mb-1">📋 File Name:</p>
                            <p className="text-lg font-bold text-gray-900 break-words">{file.name}</p>
                          </div>
                          <p className="text-gray-600">Ready to preview and import</p>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {/* Info Cards - Step Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                  <div className="text-3xl mb-2">📥</div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Upload CSV</p>
                  <p className="text-xs text-gray-700">Select your completed CSV file</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
                  <div className="text-3xl mb-2">👁️</div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Preview Data</p>
                  <p className="text-xs text-gray-700">Review products before import</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-4">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="font-bold text-gray-900 text-sm mb-1">Import & Go</p>
                  <p className="text-xs text-gray-700">Add or update all products</p>
                </div>
              </div>
            </div>
          )}

          {/* Regular File Upload (for non-ZIP imports) */}
          {!(importType === 'zip' && zipProcessed) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {importType === 'zip' ? 'Upload ZIP File' : 'Upload CSV File'}
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept={importType === 'csv' ? '.csv' : '.zip'}
                  onChange={handleFileChange}
                  className="hidden"
                  id="initialFileInput"
                />
                <label htmlFor="initialFileInput" className="cursor-pointer">
                  <div className="text-6xl mb-4">{importType === 'csv' ? '📊' : '📦'}</div>
                  <p className="text-xl font-medium text-gray-700 mb-2">
                    {file ? file.name : `Drop your ${importType === 'csv' ? 'CSV' : 'ZIP'} file here`}
                  </p>
                  <p className="text-gray-500 mb-4">
                    {importType === 'csv'
                      ? 'CSV file with product data'
                      : 'ZIP file with folders named by product code containing images'
                    }
                  </p>
                  <div className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                    Choose File
                  </div>
                </label>
              </div>
            </div>
          )}

          {file && (
            <div className="mb-6">
              {/* Action Buttons - Enhanced */}
              <div className="flex flex-wrap gap-3 mb-6">
                {(importType === 'csv' || isZipCsvUpload) && (
                  <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="group flex-1 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">👁️</span>
                        <span>Preview Import</span>
                      </>
                    )}
                  </button>
                )}

                {importType === 'zip' && !zipProcessed && (
                  <button
                    onClick={handleZipImport}
                    disabled={loading}
                    className="group flex-1 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white font-bold rounded-2xl hover:from-purple-700 hover:via-pink-600 hover:to-red-600 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Processing ZIP...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🔄</span>
                        <span>Process ZIP & Generate Template</span>
                      </>
                    )}
                  </button>
                )}

                {zipProcessed && csvDownloadUrl && (
                  <a
                    href={csvDownloadUrl}
                    download="product-import-template.csv"
                    className="flex-1 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-green-700 hover:via-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 inline-flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">📥</span>
                    <span>Download CSV Template</span>
                  </a>
                )}

                {preview && (importType === 'csv' || isZipCsvUpload) && (
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="group flex-1 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-green-700 hover:via-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        <span>Import {preview.products?.length || 0} Products</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {zipProcessed && !file && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <div className="text-3xl">✅</div>
                  <div>
                    <p className="font-bold text-green-900">ZIP Processed Successfully!</p>
                    <p className="text-sm text-green-700">Now upload your completed CSV file above</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {preview && preview.products && preview.products.length > 0 && (
            <div className="mb-6">
              {/* Preview Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                  👁️
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Import Preview</h3>
                  <p className="text-sm text-gray-600">{preview.products?.length || 0} products ready to import</p>
                </div>
              </div>

              {/* Beautiful Table */}
              <div className="border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-lg bg-white">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
                  <h4 className="font-bold text-white text-lg">Products to Import</h4>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-4 font-bold text-gray-900 w-1/4">Product Code</th>
                        <th className="text-left p-4 font-bold text-gray-900 w-2/5">Product Name</th>
                        <th className="text-center p-4 font-bold text-gray-900 w-1/6">Images</th>
                        <th className="text-right p-4 font-bold text-gray-900 w-1/4">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.products?.map((p: any, i: number) => (
                        <tr
                          key={i}
                          className="hover:bg-indigo-50 transition-colors duration-200 border-b border-gray-100"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {i + 1}
                              </div>
                              <span className="font-bold text-gray-900 font-mono">{p.productCode}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {(p.imageUrl || (p.imageUrls && p.imageUrls.length > 0)) ? (
                                <img
                                  src={getAbsoluteImageUrl(p.imageUrl || p.imageUrls[0])}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs">
                                  No img
                                </div>
                              )}
                              <span className="text-gray-900 font-medium truncate">{p.name || '—'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">
                              <span>🖼️</span>
                              <span>{p.totalImages || p.imageUrls?.length || 0}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-lg text-green-600">
                              ₹{p.singlePrice ? p.singlePrice.toLocaleString() : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-semibold">
                      Total: <span className="text-gray-900 font-bold text-lg">{preview.products?.length}</span> products
                    </span>
                    <span className="text-xs text-gray-500">Scroll to see all products</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BulkEditModal({ selectedIds, categories, onClose, onSave }: any) {
  const [bulkData, setBulkData] = useState({
    isActive: '',
    isBestseller: '',
    isNewArrival: '',
    isTopRanking: '',
    category: '',
    stock: '',
    hsnCode: '',
    singlePrice: '',
    gstPercentage: '',
    weight: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one field is set
    const hasChanges = Object.values(bulkData).some(value => value !== '')
    if (!hasChanges) {
      alert('Please set at least one field to update')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      
      // Build updates array for the bulk endpoint
      const updates: any[] = []
      
      selectedIds.forEach((id: string) => {
        const changes: any = {}
        
        if (bulkData.isActive !== '') {
          changes.isActive = bulkData.isActive === 'true'
        }
        if (bulkData.isBestseller !== '') {
          changes.isBestseller = bulkData.isBestseller === 'true'
        }
        if (bulkData.isNewArrival !== '') {
          changes.isNewArrival = bulkData.isNewArrival === 'true'
        }
        if (bulkData.isTopRanking !== '') {
          changes.isTopRanking = bulkData.isTopRanking === 'true'
        }
        if (bulkData.category !== '') {
          changes.category = bulkData.category
        }
        if (bulkData.stock !== '') {
          changes.stock = parseInt(bulkData.stock)
        }
        if (bulkData.gstPercentage !== '') {
          changes.gstPercentage = parseFloat(bulkData.gstPercentage)
        }
        
        if (Object.keys(changes).length > 0) {
          updates.push({ id, changes })
        }
      })

      if (updates.length === 0) {
        alert('No valid changes to apply')
        setLoading(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/admin/products/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      }).then(async (res) => {
        if (res.ok) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
          const bulkRes = await fetch(`${apiUrl}/admin/products/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ updates })
          });
          return bulkRes;
        }
        return res;
      });

      if (res.ok) {
        onSave()
      } else {
        const error = await res.json()
        alert(`Bulk update failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Bulk update failed')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setBulkData({...bulkData, [field]: value})
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="p-8 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Bulk Edit Products</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Update {selectedIds.length} selected products</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Bulk Update {selectedIds.length} Products</h3>
            <p className="text-sm text-gray-600">Set the fields you want to update. Leave blank to skip.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Active Status</label>
              <select
                value={bulkData.isActive}
                onChange={(e) => updateField('isActive', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">No Change</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                value={bulkData.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                placeholder="Leave blank to skip"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">GST Percentage</label>
              <input
                type="number"
                step="0.01"
                value={bulkData.gstPercentage}
                onChange={(e) => updateField('gstPercentage', e.target.value)}
                placeholder="Leave blank to skip"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select
                value={bulkData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">No Change</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Product Tags</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkData.isBestseller === 'true'}
                  onChange={(e) => updateField('isBestseller', e.target.checked ? 'true' : '')}
                />
                <span className="text-sm">Bestseller</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkData.isNewArrival === 'true'}
                  onChange={(e) => updateField('isNewArrival', e.target.checked ? 'true' : '')}
                />
                <span className="text-sm">New Arrival</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkData.isTopRanking === 'true'}
                  onChange={(e) => updateField('isTopRanking', e.target.checked ? 'true' : '')}
                />
                <span className="text-sm">Top Ranking</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Products'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

<style jsx>{`
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.7s ease-out;
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`}</style>

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}


