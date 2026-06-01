import type { FastifyPluginAsync } from 'fastify'
import type { CollectPayload } from '@beacon/shared'
import { config } from '../config'

const collectRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: CollectPayload }>('/api/collect', async (request, reply) => {
    const { events, sdk_version, app_id } = request.body

    if (!events || !Array.isArray(events) || events.length === 0) {
      return reply.code(400).send({ code: 400, data: null, message: 'events is required' })
    }

    if (!app_id) {
      return reply.code(400).send({ code: 400, data: null, message: 'app_id is required' })
    }

    if (config.mockMode) {
      return { code: 0, data: { inserted: events.length }, message: 'ok' }
    }

    const { clickhouse } = await import('../db/clickhouse')
    const rows = events.map((event) => ({
      event_id: event.event_id,
      event_name: event.event_name,
      properties: JSON.stringify(event.properties),
      timestamp: Math.floor(event.timestamp),
      user_id: event.user_id ?? '',
      session_id: event.session_id,
      page_url: event.page_url,
      referrer: event.referrer ?? '',
      user_agent: event.user_agent ?? '',
      app_id,
    }))

    await clickhouse.insert({
      table: 'events',
      values: rows,
      format: 'JSONEachRow',
    })

    return { code: 0, data: { inserted: events.length }, message: 'ok' }
  })
}

export default collectRoute
