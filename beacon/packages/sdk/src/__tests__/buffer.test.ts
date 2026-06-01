import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBuffer } from '../buffer'
import { Transport } from '../transport'

vi.mock('../transport')

function createMockTransport() {
  return {
    send: vi.fn().mockResolvedValue(true),
    sendBeacon: vi.fn().mockReturnValue(true),
  } as unknown as Transport
}

function createEvent(id: string) {
  return {
    event_id: id,
    event_name: 'test',
    properties: {},
    timestamp: Date.now(),
    session_id: 'sess-1',
    page_url: 'http://localhost',
  }
}

describe('EventBuffer', () => {
  let transport: Transport
  let buffer: EventBuffer

  beforeEach(() => {
    vi.useFakeTimers()
    transport = createMockTransport()
    buffer = new EventBuffer(transport)
  })

  afterEach(() => {
    buffer.destroy()
    vi.useRealTimers()
  })

  it('should buffer events and not send immediately', () => {
    buffer.add(createEvent('1') as any)
    expect(transport.send).not.toHaveBeenCalled()
    expect(buffer.size).toBe(1)
  })

  it('should flush when buffer reaches max size', async () => {
    for (let i = 0; i < 10; i++) {
      buffer.add(createEvent(String(i)) as any)
    }
    await vi.advanceTimersByTimeAsync(0)
    expect(transport.send).toHaveBeenCalledTimes(1)
    expect((transport.send as any).mock.calls[0][0]).toHaveLength(10)
  })

  it('should flush on timer interval', async () => {
    buffer.add(createEvent('1') as any)
    await vi.advanceTimersByTimeAsync(5000)
    expect(transport.send).toHaveBeenCalledTimes(1)
  })

  it('should retry failed events up to max retries', async () => {
    ;(transport.send as any).mockResolvedValueOnce(false)
    buffer.add(createEvent('1') as any)
    await vi.advanceTimersByTimeAsync(5000)
    expect(buffer.size).toBe(1)

    ;(transport.send as any).mockResolvedValueOnce(false)
    await vi.advanceTimersByTimeAsync(5000)
    expect(buffer.size).toBe(1)

    ;(transport.send as any).mockResolvedValueOnce(false)
    await vi.advanceTimersByTimeAsync(5000)
    expect(buffer.size).toBe(0)
  })

  it('should use sendBeacon on flushSync', () => {
    buffer.add(createEvent('1') as any)
    buffer.flushSync()
    expect(transport.sendBeacon).toHaveBeenCalledTimes(1)
  })
})
