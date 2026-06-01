import { config } from './config'
import { buildApp } from './app'

async function start() {
  const app = await buildApp()

  if (!config.mockMode) {
    try {
      const { initDatabase } = await import('./db/clickhouse')
      await initDatabase()
      app.log.info('Database initialized')
    } catch {
      app.log.warn('ClickHouse not available, starting without database init')
    }
  }

  await app.listen({ port: config.port, host: '0.0.0.0' })

  const shutdown = async () => {
    await app.close()
    if (!config.mockMode) {
      const { clickhouse } = await import('./db/clickhouse')
      await clickhouse.close()
    }
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start()
