import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  User,
  AuthTokens,
  Category,
  Product,
  Cart,
  Address,
  Order,
  PaymentMethod,
  ApiResponse,
} from '../types';

// Configure your API base URL here
const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      async (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            const tokens = await this.refreshAccessToken();
            if (tokens && originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
              return this.api(originalRequest);
            }
          } catch {
            await this.logout();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // Token Management
  // ============================================

  async loadTokens(): Promise<boolean> {
    try {
      this.accessToken = await SecureStore.getItemAsync('accessToken');
      this.refreshToken = await SecureStore.getItemAsync('refreshToken');
      return !!this.accessToken;
    } catch {
      return false;
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
  }

  private async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  // ============================================
  // Authentication
  // ============================================

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      '/auth/register',
      data
    );
    await this.saveTokens(response.data.data.tokens);
    return response.data.data;
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.api.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      '/auth/login',
      { email, password }
    );
    await this.saveTokens(response.data.data.tokens);
    return response.data.data;
  }

  async refreshAccessToken(): Promise<AuthTokens | null> {
    if (!this.refreshToken) return null;
    try {
      const response = await this.api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
        refreshToken: this.refreshToken,
      });
      await this.saveTokens(response.data.data);
      return response.data.data;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.api.post('/auth/logout', { refreshToken: this.refreshToken });
      }
    } finally {
      await this.clearTokens();
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  }

  // ============================================
  // Products & Categories
  // ============================================

  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<ApiResponse<Category[]>>('/products/categories');
    return response.data.data;
  }

  async getCategoryWithProducts(categoryId: string): Promise<Category & { products: Product[] }> {
    const response = await this.api.get<ApiResponse<Category & { products: Product[] }>>(
      `/products/categories/${categoryId}`
    );
    return response.data.data;
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    featured?: boolean;
  }): Promise<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await this.api.get('/products', { params });
    return response.data.data;
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const response = await this.api.get<ApiResponse<Product[]>>('/products/featured', {
      params: { limit },
    });
    return response.data.data;
  }

  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    const response = await this.api.get<ApiResponse<Product[]>>('/products/search', {
      params: { q: query, limit },
    });
    return response.data.data;
  }

  async getProduct(productId: string): Promise<Product> {
    const response = await this.api.get<ApiResponse<Product>>(`/products/${productId}`);
    return response.data.data;
  }

  // ============================================
  // Cart
  // ============================================

  async getCart(): Promise<Cart> {
    const response = await this.api.get<ApiResponse<Cart>>('/cart');
    return response.data.data;
  }

  async addToCart(productId: string, quantity: number): Promise<Cart> {
    const response = await this.api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data.data;
  }

  async updateCartItem(productId: string, quantity: number): Promise<Cart> {
    const response = await this.api.put<ApiResponse<Cart>>(`/cart/items/${productId}`, {
      quantity,
    });
    return response.data.data;
  }

  async removeFromCart(productId: string): Promise<Cart> {
    const response = await this.api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`);
    return response.data.data;
  }

  async clearCart(): Promise<Cart> {
    const response = await this.api.delete<ApiResponse<Cart>>('/cart');
    return response.data.data;
  }

  async validateCart(): Promise<{ valid: boolean; errors: string[] }> {
    const response = await this.api.get<ApiResponse<{ valid: boolean; errors: string[] }>>(
      '/cart/validate'
    );
    return response.data.data;
  }

  // ============================================
  // Addresses
  // ============================================

  async getAddresses(): Promise<Address[]> {
    const response = await this.api.get<ApiResponse<Address[]>>('/addresses');
    return response.data.data;
  }

  async addAddress(data: Omit<Address, 'id'>): Promise<Address> {
    const response = await this.api.post<ApiResponse<Address>>('/addresses', data);
    return response.data.data;
  }

  async updateAddress(addressId: string, data: Partial<Address>): Promise<Address> {
    const response = await this.api.put<ApiResponse<Address>>(`/addresses/${addressId}`, data);
    return response.data.data;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await this.api.delete(`/addresses/${addressId}`);
  }

  async setDefaultAddress(addressId: string): Promise<Address> {
    const response = await this.api.patch<ApiResponse<Address>>(`/addresses/${addressId}/default`);
    return response.data.data;
  }

  // ============================================
  // Orders
  // ============================================

  async createOrder(data: {
    addressId: string;
    paymentMethod: PaymentMethod;
    deliveryNotes?: string;
  }): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ orders: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await this.api.get('/orders', { params });
    return response.data.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await this.api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  }

  async getOrderTracking(orderId: string): Promise<import('../types').OrderTracking[]> {
    const response = await this.api.get<ApiResponse<import('../types').OrderTracking[]>>(
      `/orders/${orderId}/tracking`
    );
    return response.data.data;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await this.api.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
    return response.data.data;
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalSpent: number;
  }> {
    const response = await this.api.get<ApiResponse<{
      totalOrders: number;
      pendingOrders: number;
      deliveredOrders: number;
      totalSpent: number;
    }>>('/orders/stats');
    return response.data.data;
  }

  // ============================================
  // Payments
  // ============================================

  async initializePayment(orderId: string, callbackUrl?: string): Promise<{
    authorization_url: string;
    reference: string;
    access_code: string;
  }> {
    const response = await this.api.post('/payments/initialize', {
      orderId,
      callbackUrl,
    });
    return response.data.data;
  }

  async verifyPayment(reference: string): Promise<{
    status: 'success' | 'failed' | 'pending';
    reference: string;
    amount: number;
  }> {
    const response = await this.api.get(`/payments/verify/${reference}`);
    return response.data.data;
  }
}

// Export singleton instance
export const api = new ApiService();
