export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sub_category?: string;
  unit: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  store_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export interface SubCategory {
  id: string;
  name: string;
  category_id: string;
  store_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface Order {
  id?: string;
  customer_name: string;
  phone_number: string;
  email?: string;
  delivery_address: string;
  channel: 'Web' | 'WhatsApp' | 'Phone' | 'Walk-in';
  items: OrderItem[];
  delivery_fee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Delivered';
  notes: string;
  delivery_method?: 'delivery' | 'collection';
  payment_method?: 'cash' | 'bank_transfer';
  created_at?: string;
}

export interface ShopConfig {
  industry: string;
  name: string;
  tagline: string;
  currency: string;
  deliveryFee: number;
  phone: string;
  location: string;
}
