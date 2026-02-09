// Health Check System
// Runs automated checks to detect issues before users experience them

import { supabase } from './supabase';
import { performanceMonitor } from './performance-monitor';

export interface HealthStatus {
  healthy: boolean;
  checks: {
    supabase: boolean;
    database: boolean;
    performance: boolean;
  };
  details: {
    supabaseUrl: string;
    supabaseConnected: boolean;
    dbQueryTime?: number;
    avgLoadTime: number;
    errors: string[];
  };
  timestamp: number;
}

/**
 * Run comprehensive health check
 */
export async function runHealthCheck(): Promise<HealthStatus> {
  const errors: string[] = [];
  const checks = {
    supabase: false,
    database: false,
    performance: false
  };

  // Check 1: Supabase configuration
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    errors.push('Missing Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
  } else {
    checks.supabase = true;
  }

  // Check 2: Database connectivity & performance
  let dbQueryTime: number | undefined;
  let supabaseConnected = false;

  if (checks.supabase) {
    try {
      const start = Date.now();
      const { data, error } = await Promise.race([
        supabase.from('businesses').select('id').limit(1),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout after 3s')), 3000)
        )
      ]) as any;

      dbQueryTime = Date.now() - start;

      if (error) {
        errors.push(`Database error: ${error.message}`);
      } else {
        checks.database = true;
        supabaseConnected = true;

        // Warn if query is slow
        if (dbQueryTime > 1000) {
          errors.push(`Database query slow: ${dbQueryTime}ms (should be <1000ms)`);
        }
      }
    } catch (err) {
      errors.push(`Database connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Check 3: Performance metrics
  const perfSummary = performanceMonitor.getSummary();
  checks.performance = performanceMonitor.isHealthy();

  if (!checks.performance) {
    errors.push(`Performance degraded: avg load time ${perfSummary.averageLoadTime}ms`);
  }

  const healthy = checks.supabase && checks.database && checks.performance;

  return {
    healthy,
    checks,
    details: {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseConnected,
      dbQueryTime,
      avgLoadTime: perfSummary.averageLoadTime,
      errors
    },
    timestamp: Date.now()
  };
}

/**
 * Start automated health monitoring (runs every 60 seconds)
 */
export function startHealthMonitoring(onUnhealthy?: (status: HealthStatus) => void) {
  const CHECK_INTERVAL = 60000; // 1 minute

  const runCheck = async () => {
    const status = await runHealthCheck();

    if (!status.healthy) {
      console.error('🚨 [HealthCheck] System unhealthy:', status.details.errors);

      if (onUnhealthy) {
        onUnhealthy(status);
      }

      // In production, send alert (email, Slack, etc.)
      if (!import.meta.env.DEV) {
        // TODO: Send alert to monitoring service
        reportUnhealthyStatus(status);
      }
    } else {
      console.log('✅ [HealthCheck] System healthy');
    }
  };

  // Run immediately
  runCheck();

  // Then run periodically
  const intervalId = setInterval(runCheck, CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Report unhealthy status to monitoring service
 */
async function reportUnhealthyStatus(status: HealthStatus) {
  try {
    await fetch('/api/alerts/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'health_check_failed',
        status,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    });
  } catch (err) {
    console.error('Failed to report unhealthy status:', err);
  }
}
