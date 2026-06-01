import type { TrackFunction } from './pageview'

export function setupPerformance(track: TrackFunction): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return

  const reportMetrics = () => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (entries.length === 0) return

    const nav = entries[0]
    track('$performance', {
      dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      tcp: Math.round(nav.connectEnd - nav.connectStart),
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      dom_ready: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
      load: Math.round(nav.loadEventEnd - nav.fetchStart),
    })
  }

  if (document.readyState === 'complete') {
    setTimeout(reportMetrics, 0)
  } else {
    window.addEventListener('load', () => {
      setTimeout(reportMetrics, 100)
    })
  }
}
