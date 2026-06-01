import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Analytics } from '../core'

describe('Analytics', () => {
  let analytics: Analytics

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    vi.stubGlobal('location', { href: 'http://localhost/test', pathname: '/test' })
    vi.stubGlobal('document', { referrer: '', title: 'Test', readyState: 'complete', visibilityState: 'visible' })
    vi.stubGlobal('navigator', { userAgent: 'test-agent', sendBeacon: vi.fn() })
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn().mockReturnValue('test-session'),
      setItem: vi.fn(),
    })

    analytics = new Analytics()
  })

  afterEach(() => {
    analytics.destroy()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should not track before init', () => {
    analytics.track('test')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should track events after init', async () => {
    analytics.init({
      serverUrl: 'http://localhost:3001/api/collect',
      appId: 'test',
      autoPageview: false,
      autoPerformance: false,
      autoError: false,
    })

    analytics.track('button_click', { button_id: 'submit' })

    await vi.advanceTimersByTimeAsync(5000)

    expect(fetch).toHaveBeenCalledTimes(1)
    const body = JSON.parse((fetch as any).mock.calls[0][1].body)
    expect(body.events[0].event_name).toBe('button_click')
    expect(body.events[0].properties.button_id).toBe('submit')
    expect(body.app_id).toBe('test')
  })

  it('should set user id on tracked events', async () => {
    analytics.init({
      serverUrl: 'http://localhost:3001/api/collect',
      appId: 'test',
      autoPageview: false,
      autoPerformance: false,
      autoError: false,
    })

    analytics.setUser('user-123')
    analytics.track('page_view')

    await vi.advanceTimersByTimeAsync(5000)

    const body = JSON.parse((fetch as any).mock.calls[0][1].body)
    expect(body.events[0].user_id).toBe('user-123')
  })
})
