/**
 * API Client for EcomZone Backend
 * Handles all communication with the Express backend server
 */

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper function to build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Generic API request function
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  const url = buildUrl(endpoint, params);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') 
    : null;
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...(fetchOptions.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * API Client Methods
 */
export const api = {
  // Products
  products: {
    getAll: (filters?: {
      search?: string;
      category?: string;
      categories?: string;
      minPrice?: number;
      maxPrice?: number;
      type?: 'top-ranking' | 'trending' | 'new-arrivals';
    }) => apiRequest('/api/products', { params: filters }),
    
    getBySlug: (slug: string) => apiRequest(`/api/products/${slug}`),
    
    create: (data: any) => apiRequest('/api/products', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },

  // Categories
  categories: {
    getAll: () => apiRequest('/api/categories'),
    getBySlug: (slug: string) => apiRequest(`/api/categories/${slug}`),
    create: (data: any) => apiRequest('/api/categories', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },

  // Orders
  orders: {
    create: (data: any) => apiRequest('/api/orders/create', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
    getById: (orderId: string) => apiRequest(`/api/orders/${orderId}`),
    
    getMyOrders: () => apiRequest('/api/orders/my-orders'),
    
    track: (orderId: string) => apiRequest(`/api/orders/track?orderId=${orderId}`),
    
    getUserOrders: () => apiRequest('/api/orders/user'),
  },

  // Cart
  cart: {
    calculate: (items: any[]) => apiRequest('/api/cart/calculate', { 
      method: 'POST', 
      body: JSON.stringify({ items }) 
    }),
  },

  // Shipping
  shipping: {
    getRates: () => apiRequest('/api/shipping-rates'),
    create: (data: any) => apiRequest('/api/shipping-rates', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },

  // Authentication
  auth: {
    login: (email: string, password: string) => apiRequest('/api/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ email, password }) 
    }),
    
    signup: (data: any) => apiRequest('/api/auth/signup', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
    getProfile: () => apiRequest('/api/auth/profile'),
    
    forgotPassword: (email: string) => apiRequest('/api/auth/forgot-password', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    }),
  },

  // Payment
  payment: {
    createPhonePe: (data: any) => apiRequest('/api/payment/phonepe/create', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },

  // Upload
  upload: {
    file: (formData: FormData) => fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
      },
    }).then(r => r.json()),
  },

  // Email
  email: {
    send: (data: any) => apiRequest('/api/email/send', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  },

  // Invoice
  invoice: {
    getByOrderId: (orderId: string) => apiRequest(`/api/invoice/${orderId}`),
  },

  // Admin endpoints
  admin: {
    products: {
      getAll: () => apiRequest('/api/admin/products'),
      create: (data: any) => apiRequest('/api/admin/products', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id: string, data: any) => apiRequest(`/api/admin/products/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      delete: (id: string) => apiRequest(`/api/admin/products/${id}`, { 
        method: 'DELETE' 
      }),
      toggle: (id: string) => apiRequest(`/api/admin/products/${id}/toggle`, { 
        method: 'PATCH' 
      }),
      bulkImport: (data: any) => apiRequest('/api/admin/products/bulk-import', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      bulkUpsert: (data: any) => apiRequest('/api/admin/products/bulk-upsert', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      downloadCsv: () => apiRequest('/api/admin/products/download-csv'),
    },

    orders: {
      getAll: () => apiRequest('/api/admin/orders'),
      update: (data: any) => apiRequest('/api/admin/orders/update', { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
      updatePayment: (data: any) => apiRequest('/api/admin/orders/payment-update', { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
      }),
      bulkUpdate: (data: any) => apiRequest('/api/admin/orders/bulk-update', { 
        method: 'PATCH', 
        body: JSON.stringify(data) 
      }),
      downloadPdf: (orderId: string) => apiRequest(`/api/admin/orders/download-pdf?orderId=${orderId}`),
      simplePdf: (orderId: string) => apiRequest(`/api/admin/orders/simple-pdf?orderId=${orderId}`),
    },

    categories: {
      getAll: () => apiRequest('/api/admin/categories'),
      create: (data: any) => apiRequest('/api/admin/categories', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
      update: (id: string, data: any) => apiRequest(`/api/admin/categories/update/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    },

    users: {
      getAll: () => apiRequest('/api/admin/users'),
      getById: (id: string) => apiRequest(`/api/admin/users/${id}`),
      resetPassword: (data: any) => apiRequest('/api/admin/users/reset-password', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    },

    settings: {
      get: () => apiRequest('/api/admin/settings'),
      update: (data: any) => apiRequest('/api/admin/settings', { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    },
  },

  // Utility endpoints
  health: () => apiRequest('/health'),
};

export default api;
