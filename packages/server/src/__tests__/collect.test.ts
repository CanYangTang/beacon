import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/clickhouse', () => ({
  clickhouse: {
    insert: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue({ success: true }),
    close: vi.fn(),
  },
  initDatabase: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../config', () => ({
  config: {
    port: 3001,
    clickhouse: {
      url: 'http://localhost:8123',
      database: 'analytics',
      username: 'default',
      password: '',
    },
    apiToken: '',
  },
}))

import { buildApp } from '../app'
import { clickhouse } from '../db/clickhouse'

describe('POST /api/collect', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  it('should accept valid payload and insert to clickhouse', async () => {
    const payload = {
      events: [
        {
          event_id: 'test-id-1',
          event_name: 'page_view',
          properties: { page: '/home' },
          timestamp: 1700000000000,
          session_id: 'sess-1',
          page_url: 'http://localhost/home',
          user_id: 'user-1',
        },
      ],
      sdk_version: '0.1.0',
      app_id: 'test-app',
    }

    const res = await app.inject({
      method: 'POST',
      url: '/api/collect',
      payload,
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(0)
    expect(body.data.inserted).toBe(1)
    expect(clickhouse.insert).toHaveBeenCalledTimes(1)
    expect((clickhouse.insert as any).mock.calls[0][0].table).toBe('events')
  })

  it('should reject payload without events', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/collect',
      payload: { events: [], sdk_version: '0.1.0', app_id: 'test' },
    })

    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body.code).toBe(400)
  })

  it('should reject payload without app_id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/collect',
      payload: {
        events: [{ event_id: '1', event_name: 'test', properties: {}, timestamp: 1000, session_id: 's', page_url: '/' }],
        sdk_version: '0.1.0',
        app_id: '',
      },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/health', () => {
  it('should return ok when clickhouse is connected', async () => {
    const app = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/health' })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.status).toBe('ok')
    expect(body.clickhouse).toBe('connected')
  })
})
