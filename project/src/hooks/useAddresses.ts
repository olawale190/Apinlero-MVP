// Customer Addresses Hook
// Provides saved delivery addresses management

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  business_id: string | null;
  label: 'Home' | 'Work' | 'Other';
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface UseAddressesReturn {
  addresses: CustomerAddress[];
  isLoading: boolean;
  error: string | null;
  addAddress: (address: Omit<CustomerAddress, 'id' | 'customer_id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<string | null>;
  updateAddress: (id: string, data: Partial<CustomerAddress>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useAddresses(): UseAddressesReturn {
  const { profile, isAuthenticated } = useAuth();
  const { business } = useBusinessContext();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses
  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', profile.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setAddresses(data || []);
      }
    } catch (err) {
      setError('Failed to fetch addresses');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  // Load addresses when profile changes
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      refetch();
    } else {
      setAddresses([]);
    }
  }, [isAuthenticated, profile?.id, refetch]);

  // Add new address
  const addAddress = useCallback(async (
    address: Omit<CustomerAddress, 'id' | 'customer_id' | 'business_id' | 'created_at' | 'updated_at'>
  ): Promise<string | null> => {
    if (!profile?.id) return null;

    try {
      // If this is the first address or is_default is true, unset other defaults
      if (address.is_default || addresses.length === 0) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('customer_id', profile.id);
      }

      const { data, error: insertError } = await supabase
        .from('customer_addresses')
        .insert({
          ...address,
          customer_id: profile.id,
          business_id: business?.id || null,
          is_default: address.is_default || addresses.length === 0
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      setAddresses(prev => [data, ...prev]);
      return data.id;
    } catch (err) {
      setError('Failed to add address');
      return null;
    }
  }, [profile?.id, business?.id, addresses.length]);

  // Update address
  const updateAddress = useCallback(async (id: string, data: Partial<CustomerAddress>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('customer_addresses')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setAddresses(prev => prev.map(addr =>
        addr.id === id ? { ...addr, ...data } : addr
      ));
      return true;
    } catch (err) {
      setError('Failed to update address');
      return false;
    }
  }, []);

  // Delete address
  const deleteAddress = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      setAddresses(prev => prev.filter(addr => addr.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete address');
      return false;
    }
  }, []);

  // Set address as default
  const setDefaultAddress = useCallback(async (id: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      // Unset all other defaults
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', profile.id);

      // Set this one as default
      const { error: updateError } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id
      })));
      return true;
    } catch (err) {
      setError('Failed to set default address');
      return false;
    }
  }, [profile?.id]);

  return {
    addresses,
    isLoading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch
  };
}
