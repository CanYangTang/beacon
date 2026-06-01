import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { config } from '../config'

const authPlugin: FastifyPluginAsync = async (fastify) => {
  if (!config.apiToken) return

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === '/api/health') return

    const token = request.headers['x-api-token']
    if (token !== config.apiToken) {
      reply.code(401).send({ code: 401, data: null, message: 'Unauthorized' })
    }
  })
}

export default fp(authPlugin)
