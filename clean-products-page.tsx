"use client"

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react"

interface Product {
  id: string
  name: string
  singlePrice: number
  stock: number
  isActive: boolean
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simplified version - fetches products
    setTimeout(() => {
      setProducts([{ id: '1', name: 'Test Product', singlePrice: 99, stock: 10, isActive: true }])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="p-4 border rounded">
            <h2>{product.name}</h2>
            <p>₹{product.singlePrice}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  return <ProductsContent />
}
