import type { FastifyPluginAsync } from 'fastify'
import { queryEvents, queryTrend, queryTopEvents, queryOverview } from '../db/mock'

const mockEventsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/events', async (request) => {
    const q = request.query as Record<string, string>
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(q.page_size) || 20))
    const now = Date.now()

    const data = queryEvents({
      app_id: q.app_id || 'default',
      event_name: q.event_name || undefined,
      start_time: Number(q.start_time) || now - 24 * 60 * 60 * 1000,
      end_time: Number(q.end_time) || now,
      page,
      page_size: pageSize,
    })

    return { code: 0, data, message: 'ok' }
  })
}

export default mockEventsRoute
