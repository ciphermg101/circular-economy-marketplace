import { logger } from './logger';

interface PerformanceMetrics {
  fcp: number | null;  // First Contentful Paint
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  };

  private constructor() {
    this.initializePerformanceMonitoring();
    this.initializeErrorMonitoring();
    this.initializeNetworkMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializePerformanceMonitoring(): void {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.metrics.fcp = entry.startTime;
        this.reportMetric('FCP', entry.startTime);
      }
    });

    // Largest Contentful Paint
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime;
      this.reportMetric('LCP', entry.startTime);
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime;
      this.reportMetric('FID', this.metrics.fid);
    });

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        cumulativeLayoutShift += entry.value;
        this.metrics.cls = cumulativeLayoutShift;
        this.reportMetric('CLS', cumulativeLayoutShift);
      }
    });

    // Time to First Byte
    this.observePerformanceEntry('navigation', (entry) => {
      this.metrics.ttfb = entry.responseStart - entry.requestStart;
      this.reportMetric('TTFB', this.metrics.ttfb);
    });
  }

  private initializeErrorMonitoring(): void {
    window.addEventListener('error', (event) => {
      this.captureError('Uncaught error', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError('Unhandled promise rejection', event.reason);
    });
  }

  private initializeNetworkMonitoring(): void {
    this.monitorFetch();
    this.monitorXHR();
  }

  private monitorFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        this.logNetworkRequest('fetch', args[0].toString(), response.status, performance.now() - startTime);
        return response;
      } catch (error) {
        this.logNetworkError('fetch', args[0].toString(), error);
        throw error;
      }
    };
  }

  private monitorXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      const startTime = performance.now();
      this.addEventListener('load', () => {
        MonitoringService.getInstance().logNetworkRequest(
          'xhr',
          args[1],
          this.status,
          performance.now() - startTime
        );
      });
      this.addEventListener('error', () => {
        MonitoringService.getInstance().logNetworkError(
          'xhr',
          args[1],
          new Error('XHR request failed')
        );
      });
      originalOpen.apply(this, args);
    };
  }

  private observePerformanceEntry(entryType: string, callback: (entry: PerformanceEntry) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      logger.error(`Failed to observe ${entryType}:`, { error });
    }
  }

  private reportMetric(name: string, value: number): void {
    logger.info(`Performance metric: ${name}`, { value });
    
    // Send to analytics service if available
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        value: Math.round(value),
      });
    }
  }

  private logNetworkRequest(type: string, url: string, status: number, duration: number): void {
    logger.info(`Network ${type} request`, {
      url,
      status,
      duration: `${Math.round(duration)}ms`,
    });
  }

  private logNetworkError(type: string, url: string, error: Error): void {
    logger.error(`Network ${type} error`, {
      url,
      error,
    });
  }

  public captureError(message: string, error: Error | unknown): void {
    logger.error(message, { error });

    // Send to error tracking service if available
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// Export a singleton instance
export const monitoring = MonitoringService.getInstance();

// Declare global interfaces
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, any>) => void;
    Sentry?: {
      captureException(error: Error | unknown): void;
    };
  }
} 