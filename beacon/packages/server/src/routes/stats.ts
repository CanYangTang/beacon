import type { FastifyPluginAsync } from 'fastify'
import { clickhouse } from '../db/clickhouse'

interface StatsQuery {
  app_id: string
  event_name?: string
  start_time?: string
  end_time?: string
  granularity?: 'hour' | 'day'
  limit?: string
}

const statsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: StatsQuery }>('/api/stats/trend', async (request, reply) => {
    const { app_id, event_name, granularity } = request.query

    if (!app_id) {
      return reply.code(400).send({ code: 400, data: null, message: 'app_id is required' })
    }

    const now = Date.now()
    const start = Number(request.query.start_time) || now - 24 * 60 * 60 * 1000
    const end = Number(request.query.end_time) || now

    const timeFn = granularity === 'day' ? 'toStartOfDay' : 'toStartOfHour'

    let whereClause = `app_id = {app_id: String} AND timestamp >= fromUnixTimestamp64Milli({start: Int64}) AND timestamp <= fromUnixTimestamp64Milli({end: Int64})`
    if (event_name) {
      whereClause += ` AND event_name = {event_name: String}`
    }

    const result = await clickhouse.query({
      query: `SELECT ${timeFn}(timestamp) AS time, count() AS count FROM events WHERE ${whereClause} GROUP BY time ORDER BY time`,
      query_params: { app_id, start, end, event_name: event_name ?? '' },
      format: 'JSONEachRow',
    })
    const data = await result.json()

    return { code: 0, data, message: 'ok' }
  })

  fastify.get<{ Querystring: StatsQuery }>('/api/stats/top-events', async (request, reply) => {
    const { app_id } = request.query
    const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 10))

    if (!app_id) {
      return reply.code(400).send({ code: 400, data: null, message: 'app_id is required' })
    }

    const now = Date.now()
    const start = Number(request.query.start_time) || now - 24 * 60 * 60 * 1000
    const end = Number(request.query.end_time) || now

    const result = await clickhouse.query({
      query: `SELECT event_name, count() AS count FROM events WHERE app_id = {app_id: String} AND timestamp >= fromUnixTimestamp64Milli({start: Int64}) AND timestamp <= fromUnixTimestamp64Milli({end: Int64}) GROUP BY event_name ORDER BY count DESC LIMIT {limit: UInt32}`,
      query_params: { app_id, start, end, limit },
      format: 'JSONEachRow',
    })
    const data = await result.json()

    return { code: 0, data, message: 'ok' }
  })

  fastify.get<{ Querystring: StatsQuery }>('/api/stats/overview', async (request, reply) => {
    const { app_id } = request.query

    if (!app_id) {
      return reply.code(400).send({ code: 400, data: null, message: 'app_id is required' })
    }

    const now = Date.now()
    const start = Number(request.query.start_time) || now - 24 * 60 * 60 * 1000
    const end = Number(request.query.end_time) || now

    const baseWhere = `app_id = {app_id: String} AND timestamp >= fromUnixTimestamp64Milli({start: Int64}) AND timestamp <= fromUnixTimestamp64Milli({end: Int64})`
    const params = { app_id, start, end }

    const [totalResult, pvResult, usersResult, topResult] = await Promise.all([
      clickhouse.query({
        query: `SELECT count() AS total FROM events WHERE ${baseWhere}`,
        query_params: params,
        format: 'JSONEachRow',
      }),
      clickhouse.query({
        query: `SELECT count() AS total FROM events WHERE ${baseWhere} AND event_name = '$pageview'`,
        query_params: params,
        format: 'JSONEachRow',
      }),
      clickhouse.query({
        query: `SELECT uniqExact(user_id) AS total FROM events WHERE ${baseWhere} AND user_id != ''`,
        query_params: params,
        format: 'JSONEachRow',
      }),
      clickhouse.query({
        query: `SELECT event_name, count() AS count FROM events WHERE ${baseWhere} GROUP BY event_name ORDER BY count DESC LIMIT 5`,
        query_params: params,
        format: 'JSONEachRow',
      }),
    ])

    const [totalRows, pvRows, usersRows, topRows] = await Promise.all([
      totalResult.json() as Promise<{ total: string }[]>,
      pvResult.json() as Promise<{ total: string }[]>,
      usersResult.json() as Promise<{ total: string }[]>,
      topResult.json() as Promise<{ event_name: string; count: string }[]>,
    ])

    return {
      code: 0,
      data: {
        total_events: Number(totalRows[0]?.total ?? 0),
        total_pv: Number(pvRows[0]?.total ?? 0),
        unique_users: Number(usersRows[0]?.total ?? 0),
        top_events: topRows.map((r) => ({ event_name: r.event_name, count: Number(r.count) })),
      },
      message: 'ok',
    }
  })
}

export default statsRoute
