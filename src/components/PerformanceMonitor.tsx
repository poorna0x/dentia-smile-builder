import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    const metrics: PerformanceMetrics = {};

    // Measure First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
        }
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Measure Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.fid = (entry as any).processingStart - entry.startTime;
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metrics.cls = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Measure Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    }

    // Send metrics after page load
    const sendMetrics = () => {
      // You can send these metrics to your analytics service
      console.log('Performance Metrics:', metrics);
      
      // Example: Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: 'Core Web Vitals',
          value: Math.round(metrics.lcp || 0),
          custom_map: {
            fcp: metrics.fcp,
            lcp: metrics.lcp,
            fid: metrics.fid,
            cls: metrics.cls,
            ttfb: metrics.ttfb
          }
        });
      }
    };

    // Send metrics when page is about to unload
    window.addEventListener('beforeunload', sendMetrics);

    // Also send after 5 seconds to capture LCP
    setTimeout(sendMetrics, 5000);

    // Cleanup
    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      window.removeEventListener('beforeunload', sendMetrics);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor;