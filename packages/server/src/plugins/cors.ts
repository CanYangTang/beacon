import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, { origin: true })
}

export default fp(corsPlugin)
