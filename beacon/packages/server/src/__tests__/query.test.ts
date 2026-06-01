import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/clickhouse', () => ({
  clickhouse: {
    insert: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue({ success: true }),
    query: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
    }),
    close: vi.fn(),
  },
  initDatabase: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../config', () => ({
  config: {
    port: 3001,
    clickhouse: { url: 'http://localhost:8123', database: 'analytics', username: 'default', password: '' },
    apiToken: '',
  },
}))

import { buildApp } from '../app'
import { clickhouse } from '../db/clickhouse'

describe('GET /api/events', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(clickhouse.query as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
    })
    app = await buildApp({ logger: false })
  })

  it('should require app_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/events' })
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).message).toBe('app_id is required')
  })

  it('should query events with app_id', async () => {
    let callCount = 0
    ;(clickhouse.query as any).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return { json: () => Promise.resolve([{ total: '5' }]) }
      }
      return {
        json: () =>
          Promise.resolve([
            { event_id: '1', event_name: 'click', properties: '{}', timestamp: '2024-01-01' },
          ]),
      }
    })

    const res = await app.inject({ method: 'GET', url: '/api/events?app_id=test-app' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(0)
    expect(body.data.total).toBe(5)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.page).toBe(1)
  })

  it('should respect pagination params', async () => {
    ;(clickhouse.query as any).mockResolvedValue({
      json: () => Promise.resolve([{ total: '100' }]),
    })

    const res = await app.inject({ method: 'GET', url: '/api/events?app_id=test&page=2&page_size=50' })
    const body = JSON.parse(res.body)
    expect(body.data.page).toBe(2)
    expect(body.data.page_size).toBe(50)
  })
})

describe('GET /api/stats/trend', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(clickhouse.query as any).mockResolvedValue({
      json: () => Promise.resolve([{ time: '2024-01-01 00:00:00', count: '10' }]),
    })
    app = await buildApp({ logger: false })
  })

  it('should require app_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/trend' })
    expect(res.statusCode).toBe(400)
  })

  it('should return trend data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/trend?app_id=test' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(0)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].count).toBe('10')
  })
})

describe('GET /api/stats/top-events', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(clickhouse.query as any).mockResolvedValue({
      json: () => Promise.resolve([{ event_name: 'click', count: '50' }]),
    })
    app = await buildApp({ logger: false })
  })

  it('should require app_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/top-events' })
    expect(res.statusCode).toBe(400)
  })

  it('should return top events', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/top-events?app_id=test' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(0)
    expect(body.data[0].event_name).toBe('click')
  })
})

describe('GET /api/stats/overview', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(clickhouse.query as any).mockResolvedValue({
      json: () => Promise.resolve([{ total: '0' }]),
    })
    app = await buildApp({ logger: false })
  })

  it('should require app_id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/stats/overview' })
    expect(res.statusCode).toBe(400)
  })

  it('should return overview data', async () => {
    ;(clickhouse.query as any).mockImplementation(({ query }: { query: string }) => {
      if (query.includes("event_name = '\\$pageview'") || query.includes("event_name = '$pageview'")) {
        return { json: () => Promise.resolve([{ total: '200' }]) }
      }
      if (query.includes('uniqExact')) {
        return { json: () => Promise.resolve([{ total: '50' }]) }
      }
      if (query.includes('GROUP BY event_name')) {
        return { json: () => Promise.resolve([{ event_name: '$pageview', count: '20' }]) }
      }
      return { json: () => Promise.resolve([{ total: '1000' }]) }
    })

    const res = await app.inject({ method: 'GET', url: '/api/stats/overview?app_id=test' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(0)
    expect(body.data.total_events).toBe(1000)
    expect(body.data.total_pv).toBe(200)
    expect(body.data.unique_users).toBe(50)
    expect(body.data.top_events).toHaveLength(1)
  })
})
