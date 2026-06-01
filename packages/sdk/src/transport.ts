import type { TrackEvent, CollectPayload } from '@beacon/shared'

export interface TransportConfig {
  serverUrl: string
  appId: string
  sdkVersion: string
}

export class Transport {
  private config: TransportConfig

  constructor(config: TransportConfig) {
    this.config = config
  }

  async send(events: TrackEvent[]): Promise<boolean> {
    const payload: CollectPayload = {
      events,
      sdk_version: this.config.sdkVersion,
      app_id: this.config.appId,
    }

    try {
      const res = await fetch(this.config.serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return res.ok
    } catch {
      return false
    }
  }

  sendBeacon(events: TrackEvent[]): boolean {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return false
    }

    const payload: CollectPayload = {
      events,
      sdk_version: this.config.sdkVersion,
      app_id: this.config.appId,
    }

    return navigator.sendBeacon(
      this.config.serverUrl,
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    )
  }
}
