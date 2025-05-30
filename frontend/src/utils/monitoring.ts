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
      // Cast to LargestContentfulPaintEntry to access startTime safely
      const lcpEntry = entry as PerformanceEntry & { startTime: number };
      this.metrics.lcp = lcpEntry.startTime;
      this.reportMetric('LCP', lcpEntry.startTime);
    });

    // First Input Delay
    this.observePerformanceEntry('first-input', (entry) => {
      // Cast to PerformanceEventTiming for processingStart
      const fidEntry = entry as PerformanceEventTiming;
      if (fidEntry.processingStart !== undefined) {
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        this.reportMetric('FID', this.metrics.fid);
      }
    });

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    this.observePerformanceEntry('layout-shift', (entry) => {
      // Cast to LayoutShift to access hadRecentInput and value
      const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!clsEntry.hadRecentInput && clsEntry.value !== undefined) {
        cumulativeLayoutShift += clsEntry.value;
        this.metrics.cls = cumulativeLayoutShift;
        this.reportMetric('CLS', cumulativeLayoutShift);
      }
    });

    // Time to First Byte
    this.observePerformanceEntry('navigation', (entry) => {
      // Cast to PerformanceNavigationTiming for responseStart/requestStart
      const navEntry = entry as PerformanceNavigationTiming;
      if (navEntry.responseStart !== undefined && navEntry.requestStart !== undefined) {
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
      }
    });
  }

  private initializeErrorMonitoring(): void {
    window.addEventListener('error', (event) => {
      this.captureError('Uncaught error', event.error ?? new Error('Unknown error'));
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason instanceof Error) {
        this.captureError('Unhandled promise rejection', reason);
      } else {
        // Wrap non-Error reasons
        this.captureError('Unhandled promise rejection', new Error(String(reason)));
      }
    });
  }

  private initializeNetworkMonitoring(): void {
    this.monitorFetch();
    this.monitorXHR();
  }

  private monitorFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async function (...args): Promise<Response> {
      const startTime = performance.now();
      try {
        const response = await originalFetch.apply(this, args);
        MonitoringService.getInstance().logNetworkRequest(
          'fetch',
          args[0] instanceof Request ? args[0].url : String(args[0]),
          response.status,
          performance.now() - startTime
        );
        return response;
      } catch (error) {
        MonitoringService.getInstance().logNetworkError(
          'fetch',
          args[0] instanceof Request ? args[0].url : String(args[0]),
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    };
  }

  private monitorXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      const startTime = performance.now();

      this.addEventListener('load', () => {
        MonitoringService.getInstance().logNetworkRequest(
          'xhr',
          typeof url === 'string' ? url : url.toString(),
          this.status,
          performance.now() - startTime
        );
      });

      this.addEventListener('error', () => {
        MonitoringService.getInstance().logNetworkError(
          'xhr',
          typeof url === 'string' ? url : url.toString(),
          new Error('XHR request failed')
        );
      });

      return originalOpen.apply(this, [method, url, async ?? true, username ?? null, password ?? null]);
    };
  }

  private observePerformanceEntry(entryType: string, callback: (entry: PerformanceEntry) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ entryTypes: [entryType] });
    } catch {
      // Swallow errors silently or add alternative fallback if needed
    }
  }

  private reportMetric(name: string, value: number): void {
    // Send to analytics service if available
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        value: Math.round(value),
      });
    }
  }

  private logNetworkRequest(type: string, url: string, status: number, duration: number): void {
    // Here you can add custom logic or send to analytics if needed
  }

  private logNetworkError(type: string, url: string, error: Error): void {
    // Here you can add custom logic or send to analytics if needed
  }

  public captureError(message: string, error: Error): void {
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
