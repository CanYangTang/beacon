export const config = {
  port: Number(process.env.PORT ?? 3001),
  clickhouse: {
    url: process.env.CLICKHOUSE_URL ?? 'http://127.0.0.1:8123',
    database: process.env.CLICKHOUSE_DB ?? 'analytics',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  },
  apiToken: process.env.API_TOKEN ?? '',
  mockMode: process.env.MOCK_MODE === '1' || process.env.MOCK_MODE === 'true',
}
