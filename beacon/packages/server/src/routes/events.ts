import type { FastifyPluginAsync } from 'fastify'
import { clickhouse } from '../db/clickhouse'

interface EventsQuery {
  app_id: string
  event_name?: string
  start_time?: string
  end_time?: string
  page?: string
  page_size?: string
}

const eventsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: EventsQuery }>('/api/events', async (request, reply) => {
    const { app_id, event_name, start_time, end_time } = request.query
    const page = Math.max(1, Number(request.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(request.query.page_size) || 20))

    if (!app_id) {
      return reply.code(400).send({ code: 400, data: null, message: 'app_id is required' })
    }

    const now = Date.now()
    const start = start_time ? Number(start_time) : now - 24 * 60 * 60 * 1000
    const end = end_time ? Number(end_time) : now
    const offset = (page - 1) * pageSize

    let whereClause = `app_id = {app_id: String} AND timestamp >= fromUnixTimestamp64Milli({start: Int64}) AND timestamp <= fromUnixTimestamp64Milli({end: Int64})`
    if (event_name) {
      whereClause += ` AND event_name = {event_name: String}`
    }

    const countResult = await clickhouse.query({
      query: `SELECT count() as total FROM events WHERE ${whereClause}`,
      query_params: { app_id, start, end, event_name: event_name ?? '' },
      format: 'JSONEachRow',
    })
    const countRows: { total: string }[] = await countResult.json()
    const total = Number(countRows[0]?.total ?? 0)

    const dataResult = await clickhouse.query({
      query: `SELECT * FROM events WHERE ${whereClause} ORDER BY timestamp DESC LIMIT {limit: UInt32} OFFSET {offset: UInt32}`,
      query_params: { app_id, start, end, event_name: event_name ?? '', limit: pageSize, offset },
      format: 'JSONEachRow',
    })
    const items = await dataResult.json()

    return {
      code: 0,
      data: { items, total, page, page_size: pageSize },
      message: 'ok',
    }
  })
}

export default eventsRoute
