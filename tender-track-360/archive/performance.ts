// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value:
                (
                  entry as unknown as {
                    value?: number;
                    processingStart?: number;
                  }
                ).value ||
                (entry as unknown as { processingStart: number })
                  .processingStart ||
                0,
              timestamp: Date.now(),
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime,
                duration: entry.duration,
              },
            });
          }
        });

        observer.observe({
          entryTypes: [
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
          ],
        });
        this.observers.push(observer);
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Performance: ${metric.name} = ${metric.value}ms`,
        metric.metadata
      );
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metric);
    }
  }

  private sendToMonitoring(metric: PerformanceMetric) {
    // In a real implementation, send to your monitoring service
    // e.g., Sentry, DataDog, New Relic, etc.
    try {
      // Example: Send to analytics
      if (
        typeof window !== 'undefined' &&
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag
      ) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
          'event',
          'performance_metric',
          {
            metric_name: metric.name,
            metric_value: metric.value,
            custom_map: metric.metadata,
          }
        );
      }
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  // Measure function execution time
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.recordMetric({
      name: `function_${name}`,
      value: end - start,
      timestamp: Date.now(),
    });

    return result;
  }

  // Measure async function execution time
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.recordMetric({
      name: `async_function_${name}`,
      value: end - start,
      timestamp: Date.now(),
    });

    return result;
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    const start = performance.now();
    renderFn();
    const end = performance.now();

    this.recordMetric({
      name: `render_${componentName}`,
      value: end - start,
      timestamp: Date.now(),
    });
  }

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<{
    lcp?: number;
    fid?: number;
    cls?: number;
  }> {
    return new Promise((resolve) => {
      const vitals: Record<string, number> = {};
      let metricsReceived = 0;
      const expectedMetrics = 3;

      const checkComplete = () => {
        metricsReceived++;
        if (metricsReceived >= expectedMetrics) {
          resolve(vitals);
        }
      };

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
        checkComplete();
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          vitals.fid =
            (entry as unknown as { processingStart: number }).processingStart -
            entry.startTime;
        });
        checkComplete();
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          const layoutShiftEntry = entry as unknown as {
            hadRecentInput: boolean;
            value: number;
          };
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        vitals.cls = clsValue;
        checkComplete();
      }).observe({ entryTypes: ['layout-shift'] });

      // Timeout after 10 seconds
      setTimeout(() => resolve(vitals), 10000);
    });
  }

  // Get all recorded metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measureFunction:
      performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction:
      performanceMonitor.measureAsyncFunction.bind(performanceMonitor),
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getCoreWebVitals:
      performanceMonitor.getCoreWebVitals.bind(performanceMonitor),
  };
}

// Utility functions for common measurements
export function measurePageLoad(pageName: string) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      performanceMonitor.recordMetric({
        name: `page_load_${pageName}`,
        value: loadTime,
        timestamp: Date.now(),
      });
    });
  }
}

export function measureApiCall(
  endpoint: string,
  duration: number,
  success: boolean
) {
  performanceMonitor.recordMetric({
    name: `api_call_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
    value: duration,
    timestamp: Date.now(),
    metadata: {
      endpoint,
      success,
      status: success ? 'success' : 'error',
    },
  });
}
