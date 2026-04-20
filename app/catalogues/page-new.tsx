"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Product {
  id: string;
  name: string;
  productCode: string;
  imageUrl: string;
  singlePrice: number;
  cartonPrice: number;
  cartonQty: number;
  category: string;
}

export default function CataloguePage() {
  const searchParams = useSearchParams();
  const catalogueType = searchParams.get('type') || 'all-products';
  const catalogueRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [catalogueType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const catalogueTitle = {
    'all-products': 'All Products Catalogue',
    'new-arrivals': 'New Arrivals Catalogue',
    'bestsellers': 'Bestsellers Catalogue',
    'home-products': 'Home Products Catalogue',
    'beauty-products': 'Beauty Products Catalogue'
  }[catalogueType] || 'Product Catalogue';

  const generatePDF = async () => {
    if (!catalogueRef.current) return;
    
    setGenerating(true);
    try {
      // Create canvas from the catalogue div
      const canvas = await html2canvas(catalogueRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      // Get image data
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(`${catalogueType}-catalogue.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

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
          onClick={generatePDF}
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

      {/* Catalogue Content - Reference for PDF */}
      <div ref={catalogueRef} className="max-w-7xl mx-auto bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-12 text-center">
          <h1 className="text-5xl font-bold mb-4">EcomZone</h1>
          <h2 className="text-3xl font-semibold mb-2">{catalogueTitle}</h2>
          <p className="text-lg opacity-90">Generated on {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        {/* Company Info */}
        <div className="bg-gray-100 px-12 py-8 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Company</h4>
              <p className="text-gray-600 text-sm">EcomZone</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Email</h4>
              <p className="text-gray-600 text-sm">ecomzone.sales@gmail.com</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Phone</h4>
              <p className="text-gray-600 text-sm">+91 81608 72204</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Location</h4>
              <p className="text-gray-600 text-sm">Surat, Gujarat, India</p>
            </div>
          </div>
        </div>

        {/* Product Count */}
        <div className="px-12 py-6 bg-blue-50 border-b">
          <p className="text-lg font-semibold text-gray-800">
            Total Products: <span className="text-orange-600">{products.length}</span>
          </p>
        </div>

        {/* Products Table */}
        <div className="px-12 py-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-600 text-white">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-12">S.No</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-24">Code</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Product Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold w-24">Category</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-28">Single Price</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-28">Carton Price</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-20">Carton Qty</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm font-semibold">{product.productCode}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm">{product.name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">{product.category || 'N/A'}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">₹{product.singlePrice}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">{product.cartonPrice ? `₹${product.cartonPrice}` : '-'}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm">{product.cartonQty || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white px-12 py-8 border-t-4 border-orange-600">
          <div className="space-y-2 text-sm">
            <p><strong>Terms & Conditions:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>All prices are exclusive of GST</li>
              <li>Minimum order quantity: 1 carton per product</li>
              <li>Special bulk pricing available on request</li>
              <li>Images are for reference only. Actual products may vary slightly</li>
              <li>For latest information and bulk orders, contact our sales team</li>
            </ul>
            <p className="mt-4 text-xs text-gray-400">
              This is an automated catalogue generated on {new Date().toLocaleDateString('en-IN')}. Prices and availability are subject to change without notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
