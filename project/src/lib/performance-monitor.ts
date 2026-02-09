// Performance Monitoring System
// Automatically tracks page load times, API calls, and reports issues

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  pageLoad: number; // Max acceptable page load time (ms)
  apiCall: number;  // Max acceptable API call time (ms)
  dbQuery: number;  // Max acceptable DB query time (ms)
}

const THRESHOLDS: PerformanceThresholds = {
  pageLoad: 3000,  // 3 seconds max
  apiCall: 2000,   // 2 seconds max
  dbQuery: 1000,   // 1 second max
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics in memory

  /**
   * Track a performance metric
   */
  track(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Check thresholds and warn
    this.checkThreshold(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[PerformanceMonitor] ${name}: ${duration}ms`, metadata);
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad() {
    // Use Navigation Timing API
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;

      this.track('page_load', loadTime, {
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstByte: timing.responseStart - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart
      });
    }
  }

  /**
   * Track async operation (API call, DB query, etc.)
   */
  async trackAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      this.track(name, duration, { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.track(name, duration, {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check if metric exceeds threshold and warn
   */
  private checkThreshold(metric: PerformanceMetric) {
    let threshold: number | undefined;
    let type: string = '';

    if (metric.name.includes('page_load')) {
      threshold = THRESHOLDS.pageLoad;
      type = 'Page Load';
    } else if (metric.name.includes('api_') || metric.name.includes('fetch_')) {
      threshold = THRESHOLDS.apiCall;
      type = 'API Call';
    } else if (metric.name.includes('query_') || metric.name.includes('db_')) {
      threshold = THRESHOLDS.dbQuery;
      type = 'Database Query';
    }

    if (threshold && metric.duration > threshold) {
      console.warn(
        `⚠️ [PerformanceMonitor] SLOW ${type}: ${metric.name} took ${metric.duration}ms (threshold: ${threshold}ms)`,
        metric.metadata
      );

      // In production, send to monitoring service (e.g., Sentry, LogRocket)
      this.reportSlowMetric(metric, threshold, type);
    }
  }

  /**
   * Report slow performance to monitoring service
   */
  private reportSlowMetric(metric: PerformanceMetric, threshold: number, type: string) {
    // TODO: Integrate with monitoring service (Sentry, Vercel Analytics, etc.)
    if (!import.meta.env.DEV) {
      // Example: Send to your backend analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slow_performance',
          metric: metric.name,
          duration: metric.duration,
          threshold,
          category: type,
          metadata: metric.metadata,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: metric.timestamp
        })
      }).catch(err => console.error('Failed to report performance metric:', err));
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    averageLoadTime: number;
    slowestOperations: PerformanceMetric[];
    totalMetrics: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        slowestOperations: [],
        totalMetrics: 0
      };
    }

    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const average = total / this.metrics.length;

    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      averageLoadTime: Math.round(average),
      slowestOperations: slowest,
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Check if site is healthy (no slow operations recently)
   */
  isHealthy(): boolean {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 60000 // Last minute
    );

    if (recentMetrics.length === 0) return true;

    // Check if more than 30% of recent operations are slow
    const slowOps = recentMetrics.filter(m => {
      if (m.name.includes('page_load')) return m.duration > THRESHOLDS.pageLoad;
      if (m.name.includes('api_') || m.name.includes('fetch_')) return m.duration > THRESHOLDS.apiCall;
      if (m.name.includes('query_') || m.name.includes('db_')) return m.duration > THRESHOLDS.dbQuery;
      return false;
    });

    return slowOps.length / recentMetrics.length < 0.3;
  }
}

// Global singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-track page load when available
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => performanceMonitor.trackPageLoad(), 0);
  });
}
