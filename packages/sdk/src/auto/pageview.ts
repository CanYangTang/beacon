import type { TrackEvent, EventProperties } from '@beacon/shared'

export type TrackFunction = (eventName: string, properties?: EventProperties) => void

export function setupPageview(track: TrackFunction): () => void {
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  const reportPageview = () => {
    track('$pageview', {
      url: location.href,
      path: location.pathname,
      title: document.title,
    })
  }

  history.pushState = function (...args) {
    originalPushState.apply(this, args)
    reportPageview()
  }

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args)
    reportPageview()
  }

  window.addEventListener('popstate', reportPageview)

  reportPageview()

  return () => {
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
    window.removeEventListener('popstate', reportPageview)
  }
}
