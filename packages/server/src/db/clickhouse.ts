import { createClient } from '@clickhouse/client'
import { config } from '../config'

export const clickhouse = createClient({
  url: config.clickhouse.url,
  database: config.clickhouse.database,
  username: config.clickhouse.username,
  password: config.clickhouse.password,
})

const CREATE_DB_SQL = `CREATE DATABASE IF NOT EXISTS ${config.clickhouse.database}`

const CREATE_TABLE_SQL = `
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
`

export async function initDatabase(): Promise<void> {
  await clickhouse.command({ query: CREATE_DB_SQL })
  await clickhouse.command({ query: CREATE_TABLE_SQL })
}
