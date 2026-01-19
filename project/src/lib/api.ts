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
  get: () => apiCall<any>('/api/insights'),
};

export { API_BASE_URL };
