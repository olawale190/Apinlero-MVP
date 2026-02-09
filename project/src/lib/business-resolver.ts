// Business Resolver - Dynamic subdomain to business lookup
// Enables multi-tenant routing without hard-coded business subdomains

import { supabase } from './supabase';

export interface Business {
  id: string;
  slug: string; // Used as subdomain (e.g., 'ishas-treat')
  name: string;
  owner_email: string;
  phone?: string;
  is_active: boolean;
}

// In-memory cache to avoid repeated DB lookups
const businessCache = new Map<string, Business>();

/**
 * Resolve subdomain/slug to business record
 * Example: 'ishas-treat' → { id: 'uuid', name: 'Isha's Treat', ... }
 *
 * @param slug - Business subdomain/slug (e.g., 'ishas-treat')
 * @returns Business object or null if not found
 */
export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  // Check cache first
  if (businessCache.has(slug)) {
    console.log(`[business-resolver] Cache hit for slug: ${slug}`);
    return businessCache.get(slug)!;
  }

  console.log(`[business-resolver] Fetching business for slug: ${slug}`);
  const startTime = Date.now();

  try {
    // Query database with timeout
    const queryPromise = supabase
      .from('businesses')
      .select('id, slug, name, owner_email, phone, is_active')
      .eq('slug', slug)
      .eq('is_active', true) // Only active businesses
      .single();

    // Add 3 second timeout (fail fast for better UX)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout after 3s')), 3000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
    const duration = Date.now() - startTime;
    console.log(`[business-resolver] Query completed in ${duration}ms`);

    if (error) {
      console.error(`[business-resolver] Supabase error:`, error);
      return null;
    }

    if (!data) {
      console.warn(`[business-resolver] No business found for slug: ${slug}`);
      return null;
    }

    // Cache result
    const business: Business = {
      id: data.id,
      slug: data.slug,
      name: data.name,
      owner_email: data.owner_email,
      phone: data.phone,
      is_active: data.is_active
    };

    businessCache.set(slug, business);
    console.log(`[business-resolver] ✅ Business loaded and cached: ${business.name}`);
    return business;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[business-resolver] ❌ Error after ${duration}ms:`, error);
    return null;
  }
}

/**
 * Extract subdomain from current hostname
 *
 * Examples:
 *   ishas-treat.apinlero.com → 'ishas-treat'
 *   app.apinlero.com → 'app'
 *   apinlero.com → null
 *   localhost:5174 → null
 *
 * @returns Subdomain string or null if on root/localhost
 */
export function getCurrentSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Development: localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // Extract subdomain (everything before first dot)
  const parts = hostname.split('.');

  // Need at least 3 parts for subdomain (e.g., subdomain.domain.com)
  if (parts.length >= 3) {
    const subdomain = parts[0];

    // Ignore 'www' as it's not a real subdomain
    if (subdomain === 'www') {
      return null;
    }

    return subdomain; // e.g., 'ishas-treat' from 'ishas-treat.apinlero.com'
  }

  // Root domain (apinlero.com) or similar
  return null;
}

/**
 * Build URL for subdomain navigation
 *
 * Examples:
 *   buildSubdomainUrl('ishas-treat', '/') → 'https://ishas-treat.apinlero.com/'
 *   buildSubdomainUrl('app', '/dashboard') → 'https://app.apinlero.com/dashboard'
 *   (localhost) buildSubdomainUrl('ishas-treat', '/') → 'http://localhost:5174/'
 *
 * @param subdomain - Business subdomain (e.g., 'ishas-treat', 'app')
 * @param path - Path to navigate to (default: '/')
 * @returns Full URL with subdomain
 */
export function buildSubdomainUrl(subdomain: string, path: string = '/'): string {
  const protocol = window.location.protocol; // http: or https:
  const hostname = window.location.hostname;

  // Development: localhost - no subdomain support, use path-based routing
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${hostname}${port}${path}`;
  }

  // Production: subdomain.apinlero.com
  const domain = hostname.split('.').slice(-2).join('.'); // Extract 'apinlero.com'
  return `${protocol}//${subdomain}.${domain}${path}`;
}

/**
 * Clear the business cache (useful for testing or after updates)
 */
export function clearBusinessCache(): void {
  businessCache.clear();
}

/**
 * Check if current hostname is a business subdomain (not app, not root)
 *
 * @returns true if on a business store subdomain, false otherwise
 */
export function isBusinessSubdomain(): boolean {
  const subdomain = getCurrentSubdomain();
  return subdomain !== null && subdomain !== 'app';
}

/**
 * Check if current hostname is the app dashboard subdomain
 *
 * @returns true if on app.apinlero.com, false otherwise
 */
export function isAppDashboard(): boolean {
  const subdomain = getCurrentSubdomain();
  return subdomain === 'app';
}
