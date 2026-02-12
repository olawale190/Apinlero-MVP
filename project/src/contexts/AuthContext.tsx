// Customer Authentication Context Provider
// Provides global access to customer auth state for storefront

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from './BusinessContext';

// Customer profile interface (mirrors database table)
export interface CustomerProfile {
  id: string;
  user_id: string;
  business_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<CustomerProfile>) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  showAuthModal: () => void;
  hideAuthModal: () => void;
  isAuthModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Wraps storefront to provide customer auth context
 *
 * Usage:
 *   <AuthProvider>
 *     <StorefrontContent />
 *   </AuthProvider>
 *
 * Then in any component:
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { business } = useBusinessContext();

  // Fetch or create customer profile (atomic upsert prevents duplicate profiles)
  const fetchOrCreateProfile = useCallback(async (userId: string, email: string, fullName?: string) => {
    try {
      // Use upsert with onConflict to atomically create or fetch profile
      // This prevents race conditions when user opens multiple tabs
      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .upsert(
          {
            user_id: userId,
            business_id: business?.id || null,
            email: email,
            full_name: fullName || null,
            marketing_consent: false
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
        .select()
        .single();

      if (error) {
        // If upsert fails (e.g., no unique constraint on user_id), fall back to fetch
        const { data: existingProfile } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          setProfile(existingProfile);
          return existingProfile;
        }

        console.error('Error in profile upsert:', error);
        return null;
      }

      setProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error in fetchOrCreateProfile:', err);
      return null;
    }
  }, [business?.id]);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);

          // Fetch profile if user is logged in
          if (currentSession?.user) {
            await fetchOrCreateProfile(
              currentSession.user.id,
              currentSession.user.email || ''
            );
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await fetchOrCreateProfile(
            newSession.user.id,
            newSession.user.email || '',
            newSession.user.user_metadata?.full_name
          );
          setIsAuthModalOpen(false);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          error: 'Please check your email to confirm your account.'
        };
      }

      return { success: true };
    } catch (err) {
      console.error('Sign up error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Sign in error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Google sign in error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Update customer profile
  const updateProfile = async (data: Partial<CustomerProfile>): Promise<AuthResult> => {
    if (!profile?.id) {
      return { success: false, error: 'No profile found' };
    }

    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Reset password error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  // Modal controls
  const showAuthModal = () => setIsAuthModalOpen(true);
  const hideAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        resetPassword,
        showAuthModal,
        hideAuthModal,
        isAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access auth context
 *
 * Returns:
 *   - user: Supabase User object
 *   - profile: CustomerProfile from database
 *   - isLoading: true while checking auth state
 *   - isAuthenticated: true if user is logged in
 *   - signUp, signIn, signOut, etc.
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
