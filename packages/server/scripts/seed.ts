import { createClient } from '@clickhouse/client'
import { randomUUID } from 'node:crypto'

const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://127.0.0.1:8123',
  database: process.env.CLICKHOUSE_DB ?? 'analytics',
})

const EVENT_NAMES = ['$pageview', '$performance', 'button_click', 'form_submit', 'search', 'add_to_cart', 'purchase']
const PAGES = ['/home', '/products', '/products/1', '/cart', '/checkout', '/about', '/blog']
const USERS = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', '', '', '']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEvents(count: number, daysBack: number) {
  const now = Date.now()
  const events = []

  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.random() * daysBack * 24 * 60 * 60 * 1000
    const eventName = randomItem(EVENT_NAMES)
    const page = randomItem(PAGES)

    events.push({
      event_id: randomUUID(),
      event_name: eventName,
      properties: JSON.stringify({ page, button_id: eventName === 'button_click' ? 'btn-' + Math.floor(Math.random() * 5) : undefined }),
      timestamp: Math.floor(timestamp),
      user_id: randomItem(USERS),
      session_id: `sess-${Math.floor(Math.random() * 100)}`,
      page_url: `http://localhost:3000${page}`,
      referrer: '',
      user_agent: 'Mozilla/5.0 (seed script)',
      app_id: 'default',
    })
  }

  return events
}

async function seed() {
  console.log('Creating database and table...')

  await clickhouse.command({
    query: 'CREATE DATABASE IF NOT EXISTS analytics',
  })

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS events (
        event_id String,
        event_name String,
        properties String,
        timestamp DateTime64(3),
        user_id String DEFAULT '',
        session_id String,
        page_url String,
        referrer String DEFAULT '',
        user_agent String DEFAULT '',
        app_id String,
        created_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (app_id, event_name, timestamp)
    `,
  })

  console.log('Generating 5000 events across 7 days...')
  const events = generateEvents(5000, 7)

  console.log('Inserting events into ClickHouse...')
  await clickhouse.insert({
    table: 'events',
    values: events,
    format: 'JSONEachRow',
  })

  console.log(`Done! Inserted ${events.length} events.`)
  await clickhouse.close()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
