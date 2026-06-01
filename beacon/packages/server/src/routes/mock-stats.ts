import type { FastifyPluginAsync } from 'fastify'
import { queryTrend, queryTopEvents, queryOverview } from '../db/mock'

const mockStatsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/stats/trend', async (request) => {
    const q = request.query as Record<string, string>
    if (!q.app_id) {
      return { code: 400, data: null, message: 'app_id is required' }
    }

    const now = Date.now()
    const data = queryTrend({
      start_time: Number(q.start_time) || now - 24 * 60 * 60 * 1000,
      end_time: Number(q.end_time) || now,
      event_name: q.event_name || undefined,
      granularity: (q.granularity as 'hour' | 'day') || 'hour',
    })

    return { code: 0, data, message: 'ok' }
  })

  fastify.get('/api/stats/top-events', async (request) => {
    const q = request.query as Record<string, string>
    if (!q.app_id) {
      return { code: 400, data: null, message: 'app_id is required' }
    }

    const now = Date.now()
    const data = queryTopEvents({
      start_time: Number(q.start_time) || now - 24 * 60 * 60 * 1000,
      end_time: Number(q.end_time) || now,
      limit: Math.min(50, Number(q.limit) || 10),
    })

    return { code: 0, data, message: 'ok' }
  })

  fastify.get('/api/stats/overview', async (request) => {
    const q = request.query as Record<string, string>
    if (!q.app_id) {
      return { code: 400, data: null, message: 'app_id is required' }
    }

    const now = Date.now()
    const data = queryOverview({
      start_time: Number(q.start_time) || now - 24 * 60 * 60 * 1000,
      end_time: Number(q.end_time) || now,
    })

    return { code: 0, data, message: 'ok' }
  })
}

export default mockStatsRoute
