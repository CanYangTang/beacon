import type { FastifyPluginAsync } from 'fastify'
import { clickhouse } from '../db/clickhouse'

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async () => {
    try {
      await clickhouse.ping()
      return { status: 'ok', clickhouse: 'connected' }
    } catch {
      return { status: 'degraded', clickhouse: 'disconnected' }
    }
  })
}

export default healthRoute
