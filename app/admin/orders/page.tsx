"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface OrderItem {
  id: string;
  productId: string;
  productName?: string;
  product?: {
    name?: string;
    productCode?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userMobile?: string;
  user?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  orderStatus: string;
  courierName?: string;
  trackingId?: string;
  items: OrderItem[];
  createdAt: string;
  pdfGeneratedAt?: string;
}

interface OrderStats {
  all: number;
  newOrders: number;
  pendingLabel: number;
  pendingPayment: number;
  labelGenerated: number;
  packed: number;
  dispatched: number;
  delivered: number;
  completed: number;
  cancelled: number;
}

type SortField = "serialNumber" | "orderId" | "totalAmount" | "createdAt";
type SortOrder = "asc" | "desc";
type DateFilter = "all" | "today" | "yesterday" | "last7days" | "last30days" | "this month";
type StatusTab = "all" | "new" | "pendingLabel" | "pendingPayment" | "labelGenerated" | "packed" | "dispatched" | "delivered" | "completed" | "cancelled";

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as StatusTab | null;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    all: 0, newOrders: 0, pendingLabel: 0, pendingPayment: 0, labelGenerated: 0, packed: 0, dispatched: 0, delivered: 0, completed: 0, cancelled: 0
  });
  
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [downloadingLabel, setDownloadingLabel] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [packedOrders, setPackedOrders] = useState<Set<string>>(new Set());
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOrderStatus, setBulkOrderStatus] = useState("");
  const [bulkPaymentStatus, setBulkPaymentStatus] = useState("");
  const [bulkCourierName, setBulkCourierName] = useState("");
  const [bulkTrackingId, setBulkTrackingId] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const applyTabFilter = useCallback((tab: StatusTab) => {
    if (tab === "all") { setStatusFilter(""); setPaymentFilter(""); }
    else if (tab === "new") { setStatusFilter("CONFIRMED"); setPaymentFilter(""); }
    else if (tab === "pendingLabel") { setStatusFilter("CONFIRMED"); setPaymentFilter(""); }
    else if (tab === "pendingPayment") { setStatusFilter(""); setPaymentFilter("PENDING"); }
    else if (tab === "labelGenerated") { setStatusFilter("CONFIRMED"); }
    else if (tab === "packed") { setStatusFilter("PACKED"); }
    else if (tab === "dispatched") { setStatusFilter("DISPATCHED"); }
    else if (tab === "delivered") { setStatusFilter("DELIVERED"); }
    else if (tab === "completed") { setStatusFilter("DELIVERED"); setPaymentFilter("SUCCESS"); }
    else if (tab === "cancelled") { setStatusFilter("CANCELLED"); }
  }, []);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders`, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Sort by createdAt descending (newest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Assign serial numbers
        sortedData.forEach((order: Order, index: number) => {
          (order as any).serialNumber = index + 1;
        });
        
        setOrders(sortedData);
        
        const packed = new Set<string>();
        data.forEach((order: Order) => {
          if (order.pdfGeneratedAt) packed.add(order.orderId);
        });
        setPackedOrders(packed);
        
        // Calculate stats based on new flow
        const newOrders = data.filter((o: Order) => o.orderStatus === "CONFIRMED" && !o.pdfGeneratedAt);
        const pendingLabel = data.filter((o: Order) => o.orderStatus === "CONFIRMED" && !o.pdfGeneratedAt);
        const pendingPayment = data.filter((o: Order) => o.paymentStatus === "PENDING" && o.orderStatus !== "CANCELLED");
        const labelGenerated = data.filter((o: Order) => o.orderStatus === "CONFIRMED" && o.pdfGeneratedAt);
        const packedOrdersList = data.filter((o: Order) => o.orderStatus === "PACKED");
        const dispatchedOrders = data.filter((o: Order) => o.orderStatus === "DISPATCHED");
        const deliveredOrders = data.filter((o: Order) => o.orderStatus === "DELIVERED");
        const completedOrders = data.filter((o: Order) => o.orderStatus === "DELIVERED" && o.paymentStatus === "SUCCESS");
        const cancelledOrders = data.filter((o: Order) => o.orderStatus === "CANCELLED");
        
        setStats({
          all: data.length,
          newOrders: newOrders.length,
          pendingLabel: pendingLabel.length,
          pendingPayment: pendingPayment.length,
          labelGenerated: labelGenerated.length,
          packed: packedOrdersList.length,
          dispatched: dispatchedOrders.length,
          delivered: deliveredOrders.length,
          completed: completedOrders.length,
          cancelled: cancelledOrders.length,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (urlFilter) {
      setActiveTab(urlFilter);
      applyTabFilter(urlFilter);
    }
  }, [urlFilter, applyTabFilter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [urlFilter, searchQuery, statusFilter, paymentFilter, dateFilter]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchOrders();
  }, [router, fetchOrders]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateFilter) {
      case "today": return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "yesterday": return { start: new Date(today.getTime() - 24 * 60 * 60 * 1000), end: today };
      case "last7days": return { start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "last30days": return { start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "this month": return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      default: return null;
    }
  };

  const getFilteredOrders = () => {
    let filtered = [...orders];
    
    // Apply tab-specific filtering
    if (activeTab === "pendingLabel") {
      filtered = filtered.filter(o => o.orderStatus === "CONFIRMED" && !o.pdfGeneratedAt);
    } else if (activeTab === "pendingPayment") {
      filtered = filtered.filter(o => o.paymentStatus === "PENDING" && o.orderStatus !== "CANCELLED");
    } else if (activeTab === "labelGenerated") {
      filtered = filtered.filter(o => o.orderStatus === "CONFIRMED" && o.pdfGeneratedAt);
    } else if (activeTab === "completed") {
      filtered = filtered.filter(o => o.orderStatus === "DELIVERED" && o.paymentStatus === "SUCCESS");
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchNum = parseInt(q);
      filtered = filtered.filter(o => 
        (o.orderId && o.orderId.toLowerCase().includes(q)) || 
        (o.user?.name && o.user.name.toLowerCase().includes(q)) || 
        (o.user?.mobile && o.user.mobile.includes(q)) ||
        ((o as any).serialNumber === searchNum)
      );
    }
    if (statusFilter && activeTab !== "completed") filtered = filtered.filter(o => o.orderStatus === statusFilter);
    if (paymentFilter) filtered = filtered.filter(o => o.paymentStatus === paymentFilter);
    const dateRange = getDateRange();
    if (dateRange) {
      filtered = filtered.filter(o => {
        const d = new Date(o.createdAt);
        return d >= dateRange.start && d < dateRange.end;
      });
    }
    return filtered;
  };

  const getSortedAndPaginatedOrders = () => {
    const filtered = getFilteredOrders();
    
    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === "serialNumber") cmp = ((a as any).serialNumber || 0) - ((b as any).serialNumber || 0);
      else if (sortField === "orderId") cmp = (a.orderId || "").localeCompare(b.orderId || "");
      else if (sortField === "totalAmount") cmp = Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? cmp : -cmp;
    });
    
    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    
    return { filtered, paginated };
  };

  const { filtered: filteredOrders, paginated: paginatedOrders } = getSortedAndPaginatedOrders();
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const handleTabClick = (tab: StatusTab) => {
    setActiveTab(tab);
    setSelectedOrders(new Set());
    setCurrentPage(1);
    router.push(`/admin/orders?filter=${tab}`);
    applyTabFilter(tab);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/admin/orders/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ orderId, orderStatus: newStatus }),
    });
    if (res.ok) { 
      alert("Status updated"); 
      setSelectedOrder(null);
      fetchOrders(); 
    }
    else alert("Error updating status");
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiUrl}/admin/orders/payment-update`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ orderId, paymentStatus: newStatus }),
    });
    if (res.ok) { 
      alert("Payment status updated"); 
      setSelectedOrder(null);
      fetchOrders(); 
    }
    else alert("Error updating payment status");
  };

  const handleBulkUpdate = async () => {
    if (selectedOrders.size === 0) return alert("Select at least one order");
    setBulkUpdating(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders/bulk-update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          orderStatus: bulkOrderStatus || undefined,
          paymentStatus: bulkPaymentStatus || undefined,
          courierName: bulkCourierName || undefined,
          trackingId: bulkTrackingId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) { 
        alert(data.message); 
        setShowBulkModal(false); 
        setSelectedOrders(new Set());
        setBulkOrderStatus("");
        setBulkPaymentStatus("");
        setBulkCourierName("");
        setBulkTrackingId("");
        fetchOrders(); 
      }
      else alert(data.message || "Error");
    } catch { alert("Error"); }
    setBulkUpdating(false);
  };

  const generateLabel = async (orderId: string) => {
    setDownloadingLabel(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders/simple-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ orderIds: [orderId] }),
      });
      const data = await res.json();
      if (data.success) {
        setPackedOrders(prev => {
          const newSet = new Set(prev);
          newSet.add(orderId);
          return newSet;
        });
        const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
        alert("Label generated successfully!");
        fetchOrders();
      } else alert(data.message);
    } catch { alert("Error generating label"); }
    setDownloadingLabel(false);
  };

  const generateBulkLabels = async () => {
    if (selectedOrders.size === 0) return alert("Select at least one order");
    setDownloadingLabel(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders/simple-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });
      const data = await res.json();
      if (data.success) {
        const newPacked = new Set(packedOrders);
        Array.from(selectedOrders).forEach(id => newPacked.add(id));
        setPackedOrders(newPacked);
        
        const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
        
        setSelectedOrders(new Set());
        alert("Bulk labels generated successfully!");
        fetchOrders();
      } else alert(data.message);
    } catch { alert("Error generating labels"); }
    setDownloadingLabel(false);
  };

  const downloadInvoice = async (orderId: string) => {
    setDownloadingInvoice(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders/download-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ orderIds: [orderId] }),
      });
      const data = await res.json();
      if (data.success) {
        const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
      } else alert(data.message);
    } catch { alert("Error"); }
    setDownloadingInvoice(false);
  };

  // Bulk invoice generation - WORKS ACROSS MULTIPLE PAGES!
  const generateBulkInvoices = async () => {
    if (selectedOrders.size === 0) return alert("Select at least one order");
    setDownloadingInvoice(true);
    const token = localStorage.getItem("adminToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    try {
      const res = await fetch(`${apiUrl}/admin/orders/download-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
      });
      const data = await res.json();
      if (data.success) {
        const bytes = Uint8Array.from(atob(data.pdf), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
        
        setSelectedOrders(new Set());
        alert(`Bulk invoices generated successfully for ${selectedOrders.size} orders!`);
      } else alert(data.message);
    } catch { alert("Error generating invoices"); }
    setDownloadingInvoice(false);
  };

  const orderCards = [
    { title: "All Orders", count: stats.all, filter: "all" as StatusTab },
    { title: "New Orders", count: stats.newOrders, filter: "new" as StatusTab },
    { title: "Pending Label", count: stats.pendingLabel, filter: "pendingLabel" as StatusTab },
    { title: "Pending Payment", count: stats.pendingPayment, filter: "pendingPayment" as StatusTab },
    { title: "Label Generated", count: stats.labelGenerated, filter: "labelGenerated" as StatusTab },
    { title: "Packed", count: stats.packed, filter: "packed" as StatusTab },
    { title: "Dispatched", count: stats.dispatched, filter: "dispatched" as StatusTab },
    { title: "Delivered", count: stats.delivered, filter: "delivered" as StatusTab },
    { title: "Completed", count: stats.completed, filter: "completed" as StatusTab },
    { title: "Cancelled", count: stats.cancelled, filter: "cancelled" as StatusTab },
  ];

  const getStatusColor = (s: string) => {
    switch (s) {
      case "CONFIRMED": return "bg-blue-100 text-blue-700";
      case "PACKED": return "bg-purple-100 text-purple-700";
      case "DISPATCHED": return "bg-yellow-100 text-yellow-700";
      case "DELIVERED": return "bg-green-100 text-green-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentColor = (s: string) => {
    switch (s) {
      case "SUCCESS": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">Orders Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage and track all your orders</p>
      </div>

      {/* Stats Cards Grid - Beautiful Design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-8">
        {orderCards.map((card) => (
          <button 
            key={card.filter} 
            onClick={() => handleTabClick(card.filter)}
            className={`bg-white rounded-xl p-3 shadow-md border-2 border-transparent hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 ${activeTab === card.filter ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : ''}`}
          >
            <p className="text-xs text-slate-500 font-medium">{card.title}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{card.count}</p>
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
              onChange={() => {
                if (selectedOrders.size === paginatedOrders.length) setSelectedOrders(new Set());
                else setSelectedOrders(new Set(paginatedOrders.map(o => o.orderId)));
              }} 
              className="w-4 h-4 cursor-pointer" 
            />
            <span className="text-sm font-medium text-slate-700">Select All ({selectedOrders.size})</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setShowBulkModal(true)} 
              disabled={selectedOrders.size === 0}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium disabled:from-purple-300 disabled:to-purple-300 cursor-pointer hover:shadow-lg transition-all"
            >
              Bulk Update
            </button>
            <button 
              onClick={generateBulkLabels} 
              disabled={selectedOrders.size === 0 || downloadingLabel}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg text-sm font-medium disabled:from-indigo-300 disabled:to-indigo-300 cursor-pointer hover:shadow-lg transition-all"
            >
              {downloadingLabel ? "Generating..." : "Label (Bulk)"}
            </button>
            <button 
              onClick={generateBulkInvoices}
              disabled={selectedOrders.size === 0 || downloadingInvoice}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium disabled:from-red-300 disabled:to-red-300 cursor-pointer hover:shadow-lg transition-all"
            >
              {downloadingInvoice ? "Generating..." : "Invoice (Bulk)"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
          <input 
            type="text" 
            placeholder="Search by Order ID, Name, Mobile, Serial No..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg flex-1 min-w-full sm:min-w-[200px] focus:border-blue-400 focus:outline-none cursor-text" 
          />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg min-w-full sm:min-w-[140px] focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select 
            value={paymentFilter} 
            onChange={e => setPaymentFilter(e.target.value)} 
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg min-w-full sm:min-w-[140px] focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="">All Payment</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={e => setDateFilter(e.target.value as DateFilter)} 
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg min-w-full sm:min-w-[140px] focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>
          <select 
            value={sortField} 
            onChange={e => setSortField(e.target.value as SortField)} 
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg min-w-full sm:min-w-[100px] focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="createdAt">Date</option>
            <option value="serialNumber">S.No.</option>
            <option value="orderId">Order ID</option>
            <option value="totalAmount">Amount</option>
          </select>
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value as SortOrder)} 
            className="border-2 border-slate-200 p-1 sm:p-2 rounded-lg min-w-full sm:min-w-[80px] focus:border-blue-400 focus:outline-none cursor-pointer"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <p className="text-sm text-slate-500 mt-2">Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                {/* <th className="p-3 text-left cursor-pointer select-none">#</th> */}
                <th className="p-3 text-left cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={() => {
                      if (selectedOrders.size === paginatedOrders.length) setSelectedOrders(new Set());
                      else setSelectedOrders(new Set(paginatedOrders.map(o => o.orderId)));
                    }} 
                    className="cursor-pointer" 
                  />
                </th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">S.No.</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Order ID</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Customer</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Total</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Payment</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Status</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Label</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Date</th>
                <th className="p-3 text-left cursor-pointer select-none font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, idx) => (
                <tr key={order.id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="p-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.has(order.orderId)}
                      onChange={() => {
                        const ns = new Set(selectedOrders);
                        if (ns.has(order.orderId)) ns.delete(order.orderId);
                        else ns.add(order.orderId);
                        setSelectedOrders(ns);
                      }} 
                      className="cursor-pointer" 
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">{(order as any).serialNumber}</td>
                  <td className="p-3 font-mono text-xs">{order.orderId?.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3">
                    <div className="font-medium">{order.user?.name || 'N/A'}</div>
                    <div className="text-slate-400 text-xs">{order.user?.mobile || 'N/A'}</div>
                  </td>
                  <td className="p-3 font-medium">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded font-medium ${getPaymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                  <td className="p-3"><span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(order.orderStatus)}`}>{order.orderStatus}</span></td>
                  <td className="p-3">
                    {packedOrders.has(order.orderId) ? (
                      <span className="text-green-600 font-medium">✓ Generated</span>
                    ) : (
                      <button 
                        onClick={() => generateLabel(order.orderId)}
                        disabled={downloadingLabel}
                        className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 cursor-pointer font-medium"
                      >
                        Generate Label
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => setSelectedOrder(order)} 
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer hover:bg-blue-600 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginatedOrders.length === 0 && <div className="p-10 text-center text-slate-500">No orders found</div>}
        
        {/* Pagination */}
        <div className="p-4 border-t flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Per Page:</span>
            <select 
              value={pageSize} 
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border-2 border-slate-200 p-1 rounded cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              ««
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              « Prev
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage >= totalPages}
              className="px-3 py-1 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Next »
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage >= totalPages}
              className="px-2 py-1 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              »»
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">Bulk Update ({selectedOrders.size} orders)</h2>
            <div className="space-y-3">
              <select value={bulkOrderStatus} onChange={e => setBulkOrderStatus(e.target.value)} className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-lg cursor-pointer">
                <option value="">No Change - Order Status</option>
                <option value="CONFIRMED">New Order</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select value={bulkPaymentStatus} onChange={e => setBulkPaymentStatus(e.target.value)} className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-lg cursor-pointer">
                <option value="">No Change - Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
              <input type="text" value={bulkCourierName} onChange={e => setBulkCourierName(e.target.value)} placeholder="Courier Name" className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-lg cursor-text" />
              <input type="text" value={bulkTrackingId} onChange={e => setBulkTrackingId(e.target.value)} placeholder="Tracking ID" className="w-full border-2 border-slate-200 p-2 sm:p-3 rounded-lg cursor-text" />
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkOrderStatus("");
                    setBulkPaymentStatus("");
                    setBulkCourierName("");
                    setBulkTrackingId("");
                  }} 
                  className="flex-1 border-2 border-slate-200 p-2 rounded-lg cursor-pointer hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBulkUpdate} 
                  disabled={bulkUpdating} 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-2 rounded-lg disabled:from-purple-300 disabled:to-purple-300 font-medium cursor-pointer"
                >
                  {bulkUpdating ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Order Details</h2>
                <p className="text-slate-500 font-mono text-sm">#{selectedOrder.orderId}</p>
                <p className="text-slate-400 text-xs">S.No. #{(selectedOrder as any).serialNumber}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => downloadInvoice(selectedOrder.orderId)} 
                disabled={downloadingInvoice}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg cursor-pointer disabled:from-red-300 disabled:to-red-300 font-medium"
              >
                {downloadingInvoice ? "..." : "Invoice"}
              </button>
              {!packedOrders.has(selectedOrder.orderId) && (
                <button 
                  onClick={() => generateLabel(selectedOrder.orderId)} 
                  disabled={downloadingLabel}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2 rounded-lg cursor-pointer disabled:from-indigo-300 disabled:to-indigo-300 font-medium"
                >
                  {downloadingLabel ? "..." : "Generate Label"}
                </button>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg mb-4">
              <p><span className="font-semibold">Customer:</span> {selectedOrder.user?.name}</p>
              <p><span className="font-semibold">Mobile:</span> {selectedOrder.user?.mobile}</p>
              <p><span className="font-semibold">Email:</span> {selectedOrder.user?.email || 'N/A'}</p>
            </div>

            {/* Order Items Table */}
            <div className="border rounded-lg mb-4 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 font-semibold border-b">Order Items</div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 text-left">S.No.</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <div className="font-medium">{item.product?.name || 'Product'}</div>
                        <div className="text-xs text-slate-400">{item.product?.productCode || ''}</div>
                      </td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">₹{Number(item.price || 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-medium">₹{(item.quantity * Number(item.price || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr><td colSpan={4} className="p-2 text-right font-medium">Subtotal:</td><td className="p-2 text-right">₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</td></tr>
                  <tr><td colSpan={4} className="p-2 text-right font-medium">GST:</td><td className="p-2 text-right">₹{Number(selectedOrder.gstAmount || 0).toFixed(2)}</td></tr>
                  <tr><td colSpan={4} className="p-2 text-right font-bold">Total:</td><td className="p-2 text-right font-bold">₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}</td></tr>
                </tfoot>
              </table>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-2">Order Status:</p>
              <div className="flex gap-2 flex-wrap">
                {["CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => updateOrderStatus(selectedOrder.orderId, s)}
                    className={`px-3 py-1 rounded text-sm cursor-pointer font-medium ${selectedOrder.orderStatus === s ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold mb-2">Payment Status:</p>
              <div className="flex gap-2 flex-wrap">
                {["PENDING", "SUCCESS", "FAILED"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => updatePaymentStatus(selectedOrder.orderId, s)}
                    className={`px-3 py-1 rounded text-sm cursor-pointer font-medium ${selectedOrder.paymentStatus === s ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg mb-4">
              <p><span className="font-semibold">Payment Mode:</span> {selectedOrder.paymentMode}</p>
              <p><span className="font-semibold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              {selectedOrder.courierName && <p><span className="font-semibold">Courier:</span> {selectedOrder.courierName}</p>}
              {selectedOrder.trackingId && <p><span className="font-semibold">Tracking:</span> {selectedOrder.trackingId}</p>}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 text-white py-2 rounded-lg font-medium cursor-pointer hover:shadow-lg"
              >
                OK
              </button>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="flex-1 border-2 border-slate-300 text-slate-600 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return <div className="min-h-screen bg-gray-50 p-10 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-b-2 border-blue-500"></div></div>;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrdersContent />
    </Suspense>
  );
}



