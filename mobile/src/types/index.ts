// User types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Product types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  unit: string;
  minOrder: number;
  stock: number;
  image?: string;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
  };
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

// Address types
export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark?: string;
  isDefault: boolean;
}

// Order types
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'CASH_ON_DELIVERY';

export interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  total: number;
  product: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface OrderTracking {
  id: string;
  status: OrderStatus;
  description: string;
  location?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliveryNotes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  items: OrderItem[];
  address: Address;
  tracking: OrderTracking[];
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: {
    [key: string]: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
