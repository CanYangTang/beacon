import type { ApiResponse, PaginatedResponse, TrackEvent, TrendPoint, EventOverview } from '@beacon/shared'

const APP_ID = 'default'

async function request<T>(url: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams()
  query.set('app_id', APP_ID)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }

  const res = await fetch(`${url}?${query.toString()}`)
  const json: ApiResponse<T> = await res.json()

  if (json.code !== 0) {
    throw new Error(json.message)
  }
  return json.data
}

export function fetchOverview(startTime?: number, endTime?: number) {
  return request<EventOverview>('/api/stats/overview', {
    start_time: startTime,
    end_time: endTime,
  })
}

export function fetchTrend(params: {
  startTime?: number
  endTime?: number
  eventName?: string
  granularity?: 'hour' | 'day'
}) {
  return request<TrendPoint[]>('/api/stats/trend', {
    start_time: params.startTime,
    end_time: params.endTime,
    event_name: params.eventName,
    granularity: params.granularity,
  })
}

export function fetchTopEvents(params: { startTime?: number; endTime?: number; limit?: number }) {
  return request<{ event_name: string; count: string }[]>('/api/stats/top-events', {
    start_time: params.startTime,
    end_time: params.endTime,
    limit: params.limit,
  })
}

export function fetchEvents(params: {
  eventName?: string
  startTime?: number
  endTime?: number
  page?: number
  pageSize?: number
}) {
  return request<PaginatedResponse<TrackEvent>>('/api/events', {
    event_name: params.eventName,
    start_time: params.startTime,
    end_time: params.endTime,
    page: params.page,
    page_size: params.pageSize,
  })
}
