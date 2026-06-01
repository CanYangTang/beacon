import type { TrackEvent } from '@beacon/shared'

const EVENT_NAMES = ['$pageview', '$performance', 'button_click', 'form_submit', 'search', 'add_to_cart', 'purchase']
const PAGES = ['/home', '/products', '/products/1', '/cart', '/checkout', '/about', '/blog']
const USERS = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', '', '', '']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateMockEvents(count: number, daysBack: number): TrackEvent[] {
  const now = Date.now()
  const events: TrackEvent[] = []

  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.random() * daysBack * 24 * 60 * 60 * 1000
    const eventName = randomItem(EVENT_NAMES)
    const page = randomItem(PAGES)

    events.push({
      event_id: `mock-${i}-${Date.now()}`,
      event_name: eventName,
      properties: { page, button_id: eventName === 'button_click' ? `btn-${Math.floor(Math.random() * 5)}` : undefined },
      timestamp,
      user_id: randomItem(USERS),
      session_id: `sess-${Math.floor(Math.random() * 50)}`,
      page_url: `http://localhost:3000${page}`,
      referrer: '',
      user_agent: 'Mozilla/5.0 (mock)',
    })
  }

  return events.sort((a, b) => b.timestamp - a.timestamp)
}

const mockData = generateMockEvents(5000, 7)

export function queryEvents(params: {
  app_id: string
  event_name?: string
  start_time: number
  end_time: number
  page: number
  page_size: number
}) {
  let filtered = mockData.filter(
    (e) => e.timestamp >= params.start_time && e.timestamp <= params.end_time,
  )
  if (params.event_name) {
    filtered = filtered.filter((e) => e.event_name === params.event_name)
  }

  const total = filtered.length
  const offset = (params.page - 1) * params.page_size
  const items = filtered.slice(offset, offset + params.page_size)

  return { items, total, page: params.page, page_size: params.page_size }
}

export function queryTrend(params: {
  start_time: number
  end_time: number
  event_name?: string
  granularity: 'hour' | 'day'
}) {
  let filtered = mockData.filter(
    (e) => e.timestamp >= params.start_time && e.timestamp <= params.end_time,
  )
  if (params.event_name) {
    filtered = filtered.filter((e) => e.event_name === params.event_name)
  }

  const buckets = new Map<string, number>()
  for (const event of filtered) {
    const date = new Date(event.timestamp)
    let key: string
    if (params.granularity === 'day') {
      key = date.toISOString().split('T')[0]
    } else {
      key = `${date.toISOString().split('T')[0]} ${String(date.getHours()).padStart(2, '0')}:00:00`
    }
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return Array.from(buckets.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function queryTopEvents(params: { start_time: number; end_time: number; limit: number }) {
  const filtered = mockData.filter(
    (e) => e.timestamp >= params.start_time && e.timestamp <= params.end_time,
  )

  const counts = new Map<string, number>()
  for (const event of filtered) {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([event_name, count]) => ({ event_name, count: String(count) }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, params.limit)
}

export function queryOverview(params: { start_time: number; end_time: number }) {
  const filtered = mockData.filter(
    (e) => e.timestamp >= params.start_time && e.timestamp <= params.end_time,
  )

  const total_events = filtered.length
  const total_pv = filtered.filter((e) => e.event_name === '$pageview').length
  const uniqueUsers = new Set(filtered.map((e) => e.user_id).filter(Boolean))
  const unique_users = uniqueUsers.size

  const counts = new Map<string, number>()
  for (const event of filtered) {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1)
  }
  const top_events = Array.from(counts.entries())
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { total_events, total_pv, unique_users, top_events }
}
