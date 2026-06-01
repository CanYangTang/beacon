import type { TrackFunction } from './pageview'

export function setupErrorCapture(track: TrackFunction): () => void {
  const handleError = (event: ErrorEvent) => {
    track('$error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack?.slice(0, 1000) ?? '',
      type: 'uncaught',
    })
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    track('$error', {
      message: reason?.message ?? String(reason),
      stack: reason?.stack?.slice(0, 1000) ?? '',
      type: 'unhandledrejection',
    })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)

  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
  }
}
