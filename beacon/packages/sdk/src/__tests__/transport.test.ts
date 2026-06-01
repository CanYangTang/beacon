import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Transport } from '../transport'

describe('Transport', () => {
  let transport: Transport

  beforeEach(() => {
    transport = new Transport({
      serverUrl: 'http://localhost:3001/api/collect',
      appId: 'test-app',
      sdkVersion: '0.1.0',
    })
  })

  it('should send events via fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    const events = [
      {
        event_id: '1',
        event_name: 'test',
        properties: {},
        timestamp: 1000,
        session_id: 'sess',
        page_url: 'http://localhost',
      },
    ]

    const result = await transport.send(events as any)

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"app_id":"test-app"'),
    })

    vi.unstubAllGlobals()
  })

  it('should return false on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const result = await transport.send([])
    expect(result).toBe(false)

    vi.unstubAllGlobals()
  })

  it('should return false when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await transport.send([])
    expect(result).toBe(false)

    vi.unstubAllGlobals()
  })

  it('should use sendBeacon for sync flush', () => {
    const mockBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { sendBeacon: mockBeacon })

    const events = [
      {
        event_id: '1',
        event_name: 'test',
        properties: {},
        timestamp: 1000,
        session_id: 'sess',
        page_url: 'http://localhost',
      },
    ]

    const result = transport.sendBeacon(events as any)

    expect(result).toBe(true)
    expect(mockBeacon).toHaveBeenCalledWith(
      'http://localhost:3001/api/collect',
      expect.any(Blob),
    )

    vi.unstubAllGlobals()
  })
})
