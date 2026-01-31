// Customer Orders Hook
// Provides order history for customers

import { useState, useEffect, useCallback } from 'react';
import { supabase, Order } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
}

export function useOrders(): UseOrdersReturn {
  const { profile, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders for the customer
  const refetch = useCallback(async () => {
    if (!profile?.email) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query orders by customer email or phone
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_email.eq.${profile.email},phone_number.eq.${profile.phone || ''}`)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.email, profile?.phone]);

  // Load orders when profile changes
  useEffect(() => {
    if (isAuthenticated && profile?.email) {
      refetch();
    } else {
      setOrders([]);
    }
  }, [isAuthenticated, profile?.email, refetch]);

  // Get single order by ID
  const getOrderById = useCallback((id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  }, [orders]);

  return {
    orders,
    isLoading,
    error,
    refetch,
    getOrderById
  };
}
