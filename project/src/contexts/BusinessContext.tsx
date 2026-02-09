// Business Context Provider
// Provides global access to current business/client context for multi-tenant routing

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getCurrentSubdomain,
  getBusinessBySlug,
  isAppDashboard as checkIsAppDashboard,
  type Business
} from '../lib/business-resolver';

interface BusinessContextType {
  business: Business | null;
  subdomain: string | null;
  isLoading: boolean;
  isAppDashboard: boolean; // True if on app.apinlero.com
  isBusinessStore: boolean; // True if on a business subdomain (e.g., ishas-treat.apinlero.com)
  error: string | null;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

interface BusinessProviderProps {
  children: ReactNode;
}

/**
 * BusinessProvider - Wraps the app to provide business context globally
 *
 * Usage:
 *   <BusinessProvider>
 *     <App />
 *   </BusinessProvider>
 *
 * Then in any component:
 *   const { business, subdomain, isLoading } = useBusinessContext();
 */
export function BusinessProvider({ children }: BusinessProviderProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Timeout fallback: if business loading takes more than 15 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Business context loading timed out after 15s');
        setError('Failed to load business information (timeout)');
        setIsLoading(false);
      }
    }, 15000);

    async function loadBusiness() {
      try {
        const currentSubdomain = getCurrentSubdomain();
        if (mounted) {
          setSubdomain(currentSubdomain);
        }

        // Special case: app.apinlero.com (dashboard, not a business store)
        if (currentSubdomain === 'app') {
          clearTimeout(timeoutId);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        // Load business for store subdomains (e.g., ishas-treat)
        if (currentSubdomain) {
          const businessData = await getBusinessBySlug(currentSubdomain);

          if (mounted) {
            if (businessData) {
              setBusiness(businessData);
            } else {
              setError(`No active business found for subdomain: ${currentSubdomain}`);
            }
          }
        } else {
          // ROOT DOMAIN (apinlero.com) or LOCALHOST
          const pathname = window.location.pathname;

          // Only load business data if we're on a store route (e.g., /store/ishas-treat)
          // This prevents unnecessary DB queries on the landing page
          if (pathname.startsWith('/store/')) {
            const defaultBusinessData = await getBusinessBySlug('ishas-treat');

            if (mounted) {
              if (defaultBusinessData) {
                setBusiness(defaultBusinessData);
              } else {
                setError('No default business found. Please ensure database is seeded.');
              }
            }
          } else {
            // Landing page or other routes - no business needed
            if (mounted) {
              setBusiness(null);
            }
          }
        }

        clearTimeout(timeoutId);
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[BusinessContext] Error loading business context:', err);
        clearTimeout(timeoutId);
        if (mounted) {
          setError('Failed to load business information');
          setIsLoading(false);
        }
      }
    }

    loadBusiness();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const isAppDashboard = checkIsAppDashboard();
  const isBusinessStore = subdomain !== null && subdomain !== 'app';

  return (
    <BusinessContext.Provider
      value={{
        business,
        subdomain,
        isLoading,
        isAppDashboard,
        isBusinessStore,
        error
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

/**
 * useBusinessContext - Hook to access business context
 *
 * Returns:
 *   - business: Business object (id, slug, name, owner_email, etc.)
 *   - subdomain: Current subdomain ('ishas-treat', 'app', or null)
 *   - isLoading: true while fetching business data
 *   - isAppDashboard: true if on app.apinlero.com
 *   - isBusinessStore: true if on a business store subdomain
 *   - error: Error message if business lookup failed
 *
 * Returns default values if used outside of BusinessProvider (for app.apinlero.com)
 */
export function useBusinessContext(): BusinessContextType {
  const context = useContext(BusinessContext);

  if (context === undefined) {
    // Return default values for app.apinlero.com (no BusinessProvider)
    return {
      business: null,
      subdomain: null,
      isLoading: false,
      isAppDashboard: true,
      isBusinessStore: false,
      error: null
    };
  }

  return context;
}
