import type { TrackEvent, EventProperties } from '@beacon/shared'
import { Transport } from './transport'
import { EventBuffer } from './buffer'
import { getSessionId } from './session'
import { generateId, now } from './utils'
import { setupPageview } from './auto/pageview'
import { setupPerformance } from './auto/performance'
import { setupErrorCapture } from './auto/error'

const SDK_VERSION = '0.1.0'

export interface AnalyticsConfig {
  serverUrl: string
  appId: string
  autoPageview?: boolean
  autoPerformance?: boolean
  autoError?: boolean
}

export class Analytics {
  private config: AnalyticsConfig | null = null
  private transport: Transport | null = null
  private buffer: EventBuffer | null = null
  private userId: string | undefined
  private cleanups: (() => void)[] = []

  init(config: AnalyticsConfig): void {
    this.config = {
      autoPageview: true,
      autoPerformance: true,
      autoError: true,
      ...config,
    }

    this.transport = new Transport({
      serverUrl: config.serverUrl,
      appId: config.appId,
      sdkVersion: SDK_VERSION,
    })

    this.buffer = new EventBuffer(this.transport)

    if (typeof window !== 'undefined') {
      if (this.config.autoPageview) {
        this.cleanups.push(setupPageview(this.track.bind(this)))
      }
      if (this.config.autoPerformance) {
        setupPerformance(this.track.bind(this))
      }
      if (this.config.autoError) {
        this.cleanups.push(setupErrorCapture(this.track.bind(this)))
      }
    }
  }

  track(eventName: string, properties: EventProperties = {}): void {
    if (!this.buffer) return

    const event: TrackEvent = {
      event_id: generateId(),
      event_name: eventName,
      properties,
      timestamp: now(),
      user_id: this.userId,
      session_id: getSessionId(),
      page_url: typeof location !== 'undefined' ? location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }

    this.buffer.add(event)
  }

  setUser(userId: string): void {
    this.userId = userId
  }

  flush(): Promise<void> {
    return this.buffer?.flush() ?? Promise.resolve()
  }

  destroy(): void {
    for (const cleanup of this.cleanups) {
      cleanup()
    }
    this.cleanups = []
    this.buffer?.destroy()
    this.buffer = null
  }
}
