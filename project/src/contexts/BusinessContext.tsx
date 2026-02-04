// Business Context Provider
// Provides global access to current business/client context for multi-tenant routing

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    async function loadBusiness() {
      try {
        const currentSubdomain = getCurrentSubdomain();
        setSubdomain(currentSubdomain);

        // Special case: app.apinlero.com (dashboard, not a business store)
        if (currentSubdomain === 'app') {
          setIsLoading(false);
          return;
        }

        // Load business for store subdomains (e.g., ishas-treat)
        if (currentSubdomain) {
          const businessData = await getBusinessBySlug(currentSubdomain);

          if (businessData) {
            setBusiness(businessData);
          } else {
            setError(`No active business found for subdomain: ${currentSubdomain}`);
          }
        } else {
          // LOCALHOST/ROOT DOMAIN: Load default business (ishas-treat)
          // This handles path-based routing (e.g., localhost:5174/store/ishas-treat)
          const defaultBusinessData = await getBusinessBySlug('ishas-treat');

          if (defaultBusinessData) {
            setBusiness(defaultBusinessData);
          } else {
            setError('No default business found. Please ensure database is seeded.');
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading business context:', err);
        setError('Failed to load business information');
        setIsLoading(false);
      }
    }

    loadBusiness();
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
 * @throws Error if used outside of BusinessProvider
 */
export function useBusinessContext(): BusinessContextType {
  const context = useContext(BusinessContext);

  if (context === undefined) {
    throw new Error('useBusinessContext must be used within BusinessProvider');
  }

  return context;
}
