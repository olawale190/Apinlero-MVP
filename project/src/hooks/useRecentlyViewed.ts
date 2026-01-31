// Recently Viewed Products Hook
// Tracks products customers have viewed with localStorage fallback

import { useState, useEffect, useCallback } from 'react';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';

const RECENTLY_VIEWED_KEY = 'apinlero_recently_viewed';
const MAX_RECENTLY_VIEWED = 20;

interface RecentlyViewedItem {
  id: string;
  product_id: string;
  viewed_at: string;
}

interface UseRecentlyViewedReturn {
  recentlyViewedIds: string[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addToRecentlyViewed: (productId: string) => Promise<void>;
  clearRecentlyViewed: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Load from localStorage
function loadFromStorage(): string[] {
  try {
    const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(id => typeof id === 'string').slice(0, MAX_RECENTLY_VIEWED);
      }
    }
  } catch (error) {
    console.error('Failed to load recently viewed from storage:', error);
  }
  return [];
}

// Save to localStorage
function saveToStorage(ids: string[]) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids.slice(0, MAX_RECENTLY_VIEWED)));
  } catch (error) {
    console.error('Failed to save recently viewed to storage:', error);
  }
}

export function useRecentlyViewed(): UseRecentlyViewedReturn {
  const { profile, isAuthenticated } = useAuth();
  const { business } = useBusinessContext();
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<RecentlyViewedItem[]>([]);
  const [localRecentlyViewed, setLocalRecentlyViewed] = useState<string[]>(() => loadFromStorage());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get IDs (from DB if authenticated, localStorage if guest)
  const recentlyViewedIds = isAuthenticated && profile?.id
    ? recentlyViewedItems.map(item => item.product_id)
    : localRecentlyViewed;

  // Sync localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      saveToStorage(localRecentlyViewed);
    }
  }, [localRecentlyViewed, isAuthenticated]);

  // Fetch from database
  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setRecentlyViewedItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('recently_viewed')
        .select('id, product_id, viewed_at')
        .eq('customer_id', profile.id)
        .order('viewed_at', { ascending: false })
        .limit(MAX_RECENTLY_VIEWED);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRecentlyViewedItems(data || []);
      }
    } catch (err) {
      setError('Failed to fetch recently viewed');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  // Load when profile changes
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      refetch();
    } else {
      setRecentlyViewedItems([]);
    }
  }, [isAuthenticated, profile?.id, refetch]);

  // Fetch products for display
  useEffect(() => {
    async function fetchProducts() {
      if (recentlyViewedIds.length === 0) {
        setProducts([]);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .in('id', recentlyViewedIds)
          .eq('is_active', true);

        if (!fetchError && data) {
          // Sort by recentlyViewedIds order
          const sorted = recentlyViewedIds
            .map(id => data.find(p => p.id === id))
            .filter((p): p is Product => p !== undefined);
          setProducts(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch recently viewed products:', err);
      }
    }

    fetchProducts();
  }, [recentlyViewedIds]);

  // Add to recently viewed
  const addToRecentlyViewed = useCallback(async (productId: string) => {
    if (isAuthenticated && profile?.id) {
      // Upsert to database (update viewed_at if exists)
      try {
        await supabase
          .from('recently_viewed')
          .upsert({
            customer_id: profile.id,
            business_id: business?.id || null,
            product_id: productId,
            viewed_at: new Date().toISOString()
          }, {
            onConflict: 'customer_id,product_id'
          });

        // Refetch to get updated order
        await refetch();
      } catch (err) {
        console.error('Failed to add to recently viewed:', err);
      }
    } else {
      // Add to localStorage for guests
      setLocalRecentlyViewed(prev => {
        // Remove if already exists, then add to front
        const filtered = prev.filter(id => id !== productId);
        return [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      });
    }
  }, [isAuthenticated, profile?.id, business?.id, refetch]);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(async () => {
    if (isAuthenticated && profile?.id) {
      try {
        const { error: deleteError } = await supabase
          .from('recently_viewed')
          .delete()
          .eq('customer_id', profile.id);

        if (deleteError) {
          setError(deleteError.message);
        } else {
          setRecentlyViewedItems([]);
          setProducts([]);
        }
      } catch (err) {
        setError('Failed to clear recently viewed');
      }
    } else {
      setLocalRecentlyViewed([]);
      setProducts([]);
    }
  }, [isAuthenticated, profile?.id]);

  // Sync localStorage to DB on login
  useEffect(() => {
    async function syncOnLogin() {
      if (!isAuthenticated || !profile?.id || localRecentlyViewed.length === 0) return;

      try {
        for (const productId of localRecentlyViewed) {
          await supabase
            .from('recently_viewed')
            .upsert({
              customer_id: profile.id,
              business_id: business?.id || null,
              product_id: productId,
              viewed_at: new Date().toISOString()
            }, {
              onConflict: 'customer_id,product_id'
            });
        }

        // Clear localStorage after sync
        setLocalRecentlyViewed([]);
        localStorage.removeItem(RECENTLY_VIEWED_KEY);

        // Refetch from database
        await refetch();
      } catch (err) {
        console.error('Failed to sync recently viewed:', err);
      }
    }

    syncOnLogin();
  }, [isAuthenticated, profile?.id]); // Don't include other deps to prevent loops

  return {
    recentlyViewedIds,
    products,
    isLoading,
    error,
    addToRecentlyViewed,
    clearRecentlyViewed,
    refetch
  };
}
