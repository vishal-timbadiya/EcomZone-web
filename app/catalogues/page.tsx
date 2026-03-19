"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  productCode: string;
  imageUrl: string;
  singlePrice: number;
  cartonQty: number;
}

function CatalogueContent() {
  const searchParams = useSearchParams();
  const catalogueType = searchParams.get('type') || 'all-products';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [catalogueType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/catalogue-pdf?type=${catalogueType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to generate PDF`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('PDF generation returned empty file');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${catalogueType}-catalogue.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const catalogueTitle = {
    'all-products': 'All Products Catalogue',
    'new-arrivals': 'New Arrivals Catalogue',
    'bestsellers': 'Bestsellers Catalogue',
    'home-products': 'Home Products Catalogue',
    'beauty-products': 'Beauty Products Catalogue'
  }[catalogueType] || 'Product Catalogue';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Download Button */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={downloadPDF}
          disabled={generating || products.length === 0}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              📥 Download as PDF
            </>
          )}
        </button>
      </div>

      {/* Catalogue Preview */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b-2">
          <h1 className="text-5xl font-bold text-orange-600 mb-2">EcomZone</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">{catalogueTitle}</h2>
          <p className="text-gray-500">Generated on {new Date().toLocaleDateString('en-IN')}</p>
          <p className="text-gray-500 text-sm mt-2">Total Products: <strong>{products.length}</strong></p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border-2 border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`text-gray-400 text-sm ${product.imageUrl ? 'hidden' : ''}`}>No Image</div>
              </div>

              {/* Product Details */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 line-clamp-2 h-14">{product.name}</h3>

                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Price */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">PRICE</p>
                      <p className="text-xl font-bold text-orange-600">₹{Math.round(product.singlePrice)}</p>
                    </div>

                    {/* Carton Qty */}
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">CTN QTY</p>
                      <p className="text-xl font-bold text-gray-800">{product.cartonQty || '-'}</p>
                    </div>
                  </div>

                  {/* Product Code */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold">PRODUCT CODE</p>
                    <p className="text-sm font-bold text-gray-800">{product.productCode}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center text-gray-500 text-sm">
          <p><strong>Note:</strong> This is an automated catalogue. Prices and availability are subject to change.</p>
          <p className="mt-2">Email: ecomzone.sales@gmail.com | Phone: +91 81608 72204</p>
        </div>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <CatalogueContent />
    </Suspense>
  );
}

