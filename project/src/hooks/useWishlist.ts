// Customer Wishlist Hook
// Provides wishlist functionality with localStorage fallback for guests

import { useState, useEffect, useCallback } from 'react';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';

const WISHLIST_STORAGE_KEY = 'apinlero_wishlist';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
}

interface UseWishlistReturn {
  wishlistIds: string[];
  wishlistItems: WishlistItem[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  syncWishlistOnLogin: () => Promise<void>;
  refetch: () => Promise<void>;
}

// Load wishlist from localStorage
function loadWishlistFromStorage(): string[] {
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(id => typeof id === 'string');
      }
    }
  } catch (error) {
    console.error('Failed to load wishlist from storage:', error);
  }
  return [];
}

// Save wishlist to localStorage
function saveWishlistToStorage(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save wishlist to storage:', error);
  }
}

export function useWishlist(): UseWishlistReturn {
  const { profile, isAuthenticated } = useAuth();
  const { business } = useBusinessContext();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [localWishlist, setLocalWishlist] = useState<string[]>(() => loadWishlistFromStorage());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wishlist IDs (from DB if authenticated, localStorage if guest)
  const wishlistIds = isAuthenticated && profile?.id
    ? wishlistItems.map(item => item.product_id)
    : localWishlist;

  // Sync localStorage whenever localWishlist changes (for guests)
  useEffect(() => {
    if (!isAuthenticated) {
      saveWishlistToStorage(localWishlist);
    }
  }, [localWishlist, isAuthenticated]);

  // Fetch wishlist from database
  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setWishlistItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('wishlist')
        .select('id, product_id, created_at')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setWishlistItems(data || []);
      }
    } catch (err) {
      setError('Failed to fetch wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  // Load wishlist when profile changes
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      refetch();
    } else {
      setWishlistItems([]);
    }
  }, [isAuthenticated, profile?.id, refetch]);

  // Fetch products for wishlist display
  useEffect(() => {
    async function fetchProducts() {
      if (wishlistIds.length === 0) {
        setProducts([]);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .in('id', wishlistIds)
          .eq('is_active', true);

        if (!fetchError && data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch wishlist products:', err);
      }
    }

    fetchProducts();
  }, [wishlistIds]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  // Add to wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) return;

    if (isAuthenticated && profile?.id) {
      // Add to database
      try {
        const { data, error: insertError } = await supabase
          .from('wishlist')
          .insert({
            customer_id: profile.id,
            business_id: business?.id || null,
            product_id: productId
          })
          .select()
          .single();

        if (insertError) {
          // Might be duplicate, ignore
          if (!insertError.message.includes('duplicate')) {
            setError(insertError.message);
          }
        } else if (data) {
          setWishlistItems(prev => [data, ...prev]);
        }
      } catch (err) {
        setError('Failed to add to wishlist');
      }
    } else {
      // Add to localStorage for guests
      setLocalWishlist(prev => [productId, ...prev]);
    }
  }, [isAuthenticated, profile?.id, business?.id, isInWishlist]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId: string) => {
    if (isAuthenticated && profile?.id) {
      // Remove from database
      try {
        const { error: deleteError } = await supabase
          .from('wishlist')
          .delete()
          .eq('customer_id', profile.id)
          .eq('product_id', productId);

        if (deleteError) {
          setError(deleteError.message);
        } else {
          setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        }
      } catch (err) {
        setError('Failed to remove from wishlist');
      }
    } else {
      // Remove from localStorage for guests
      setLocalWishlist(prev => prev.filter(id => id !== productId));
    }
  }, [isAuthenticated, profile?.id]);

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  // Clear wishlist
  const clearWishlist = useCallback(async () => {
    if (isAuthenticated && profile?.id) {
      try {
        const { error: deleteError } = await supabase
          .from('wishlist')
          .delete()
          .eq('customer_id', profile.id);

        if (deleteError) {
          setError(deleteError.message);
        } else {
          setWishlistItems([]);
        }
      } catch (err) {
        setError('Failed to clear wishlist');
      }
    } else {
      setLocalWishlist([]);
    }
  }, [isAuthenticated, profile?.id]);

  // Sync localStorage wishlist to database on login
  const syncWishlistOnLogin = useCallback(async () => {
    if (!profile?.id || localWishlist.length === 0) return;

    try {
      // Add each local wishlist item to database
      for (const productId of localWishlist) {
        await supabase
          .from('wishlist')
          .upsert({
            customer_id: profile.id,
            business_id: business?.id || null,
            product_id: productId
          }, {
            onConflict: 'customer_id,product_id'
          });
      }

      // Clear localStorage after sync
      setLocalWishlist([]);
      localStorage.removeItem(WISHLIST_STORAGE_KEY);

      // Refetch from database
      await refetch();
    } catch (err) {
      console.error('Failed to sync wishlist:', err);
    }
  }, [profile?.id, business?.id, localWishlist, refetch]);

  // Auto-sync on login
  useEffect(() => {
    if (isAuthenticated && profile?.id && localWishlist.length > 0) {
      syncWishlistOnLogin();
    }
  }, [isAuthenticated, profile?.id]); // Don't include localWishlist or syncWishlistOnLogin to prevent loops

  return {
    wishlistIds,
    wishlistItems,
    products,
    isLoading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    syncWishlistOnLogin,
    refetch
  };
}
