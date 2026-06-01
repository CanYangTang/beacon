export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined
}

export interface TrackEvent {
  event_id: string
  event_name: string
  properties: EventProperties
  timestamp: number
  user_id?: string
  session_id: string
  page_url: string
  referrer?: string
  user_agent?: string
}

export interface CollectPayload {
  events: TrackEvent[]
  sdk_version: string
  app_id: string
}

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface TrendPoint {
  time: string
  count: number
}

export interface EventOverview {
  total_events: number
  total_pv: number
  unique_users: number
  top_events: { event_name: string; count: number }[]
}
