import type { TrackEvent } from '@beacon/shared'
import { Transport } from './transport'

const MAX_BUFFER_SIZE = 10
const FLUSH_INTERVAL_MS = 5000
const MAX_RETRIES = 2

export class EventBuffer {
  private queue: TrackEvent[] = []
  private transport: Transport
  private timer: ReturnType<typeof setInterval> | null = null
  private retryCount = new Map<string, number>()

  constructor(transport: Transport) {
    this.transport = transport
    this.startTimer()
    this.bindUnload()
  }

  add(event: TrackEvent): void {
    this.queue.push(event)
    if (this.queue.length >= MAX_BUFFER_SIZE) {
      this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const events = this.queue.splice(0)
    const success = await this.transport.send(events)

    if (!success) {
      for (const event of events) {
        const retries = this.retryCount.get(event.event_id) ?? 0
        if (retries < MAX_RETRIES) {
          this.retryCount.set(event.event_id, retries + 1)
          this.queue.push(event)
        }
      }
    } else {
      for (const event of events) {
        this.retryCount.delete(event.event_id)
      }
    }
  }

  flushSync(): void {
    if (this.queue.length === 0) return
    const events = this.queue.splice(0)
    this.transport.sendBeacon(events)
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.flushSync()
  }

  get size(): number {
    return this.queue.length
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush()
    }, FLUSH_INTERVAL_MS)
  }

  private bindUnload(): void {
    if (typeof window === 'undefined') return
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushSync()
      }
    })
    window.addEventListener('pagehide', () => {
      this.flushSync()
    })
  }
}
