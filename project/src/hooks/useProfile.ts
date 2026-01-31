// Customer Profile Hook
// Provides profile management functionality

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, CustomerProfile } from '../contexts/AuthContext';

interface UseProfileReturn {
  profile: CustomerProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user, profile: authProfile, updateProfile: authUpdateProfile } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(authProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with auth context profile
  useEffect(() => {
    setProfile(authProfile);
  }, [authProfile]);

  // Fetch profile from database
  const refetch = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<CustomerProfile>): Promise<boolean> => {
    const result = await authUpdateProfile(data);
    if (result.success) {
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } else {
      setError(result.error || 'Failed to update profile');
    }
    return result.success;
  }, [authUpdateProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch
  };
}
