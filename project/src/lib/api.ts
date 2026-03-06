// API Configuration for Àpínlẹ̀rọ Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// Products API
export const productsApi = {
  getAll: () => apiCall<any[]>('/api/products'),
  getById: (id: string) => apiCall<any>(`/api/products/${id}`),
};

// Orders API
export const ordersApi = {
  create: (orderData: any) =>
    apiCall<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getAll: () => apiCall<any[]>('/api/orders'),
  updateStatus: (id: string, status: string) =>
    apiCall<any>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Payments API
export const paymentsApi = {
  createPaymentIntent: (amount: number, currency = 'gbp', metadata?: any) =>
    apiCall<{ clientSecret: string; paymentIntentId: string }>(
      '/api/create-payment-intent',
      {
        method: 'POST',
        body: JSON.stringify({ amount, currency, metadata }),
      }
    ),
};

// Insights API
export const insightsApi = {
  get: (token?: string) =>
    apiCall<any>('/api/insights', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
};

// Upload API (Cloudinary AI-powered bulk image upload)
export const uploadApi = {
  single: async (file: File, token: string) => {
    const form = new FormData();
    form.append('image', file);
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return response.json();
  },

  bulk: async (files: File[], token: string) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    const response = await fetch(`${API_BASE_URL}/api/upload/bulk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Bulk upload failed' }));
      throw new Error(err.error || 'Bulk upload failed');
    }
    return response.json();
  },

  bulkAssign: async (
    assignments: Array<{ productId: string; imageUrl: string }>,
    token: string,
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/upload/bulk-assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assignments }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Bulk assign failed' }));
      throw new Error(err.error || 'Bulk assign failed');
    }
    return response.json();
  },
};

export { API_BASE_URL };
