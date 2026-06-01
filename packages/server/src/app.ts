import Fastify from 'fastify'
import { config } from './config'
import corsPlugin from './plugins/cors'
import authPlugin from './plugins/auth'
import healthRoute from './routes/health'
import collectRoute from './routes/collect'
import eventsRoute from './routes/events'
import statsRoute from './routes/stats'
import mockEventsRoute from './routes/mock-events'
import mockStatsRoute from './routes/mock-stats'

export async function buildApp(options?: { logger?: boolean; mock?: boolean }) {
  const app = Fastify({ logger: options?.logger ?? true })
  const useMock = options?.mock ?? config.mockMode

  await app.register(corsPlugin)
  await app.register(authPlugin)
  await app.register(healthRoute)
  await app.register(collectRoute)

  if (useMock) {
    app.log.info('Running in MOCK mode — using in-memory data')
    await app.register(mockEventsRoute)
    await app.register(mockStatsRoute)
  } else {
    await app.register(eventsRoute)
    await app.register(statsRoute)
  }

  return app
}
