import { Analytics } from './core'
import type { AnalyticsConfig } from './core'
import type { EventProperties } from '@beacon/shared'

export type { AnalyticsConfig } from './core'
export type { EventProperties, TrackEvent, CollectPayload } from '@beacon/shared'

const instance = new Analytics()

export function init(config: AnalyticsConfig): void {
  instance.init(config)
}

export function track(eventName: string, properties?: EventProperties): void {
  instance.track(eventName, properties)
}

export function setUser(userId: string): void {
  instance.setUser(userId)
}

export function flush(): Promise<void> {
  return instance.flush()
}

export function destroy(): void {
  instance.destroy()
}

export { Analytics }
