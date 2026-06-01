# Beacon 架构文档

## 整体架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户浏览器  │────▶│  SDK (前端)  │────▶│  Server API  │────▶│  ClickHouse │
│             │     │             │     │   (Fastify)  │     │  (事件存储)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │  Web (React) │
                                          │   (可视化)   │
                                          └─────────────┘
```

## 模块说明

### 1. SDK (`packages/sdk`)
前端打点 SDK，负责采集用户行为数据。

**核心文件：**
- `src/core.ts` - Analytics 类，核心逻辑
- `src/auto/` - 自动采集（页面 PV、停留时长）
- `src/buffer.ts` - 数据缓冲，支持批量上报
- `src/transport.ts` - HTTP 上报通道
- `src/session.ts` - 会话管理

**对外 API：**
```typescript
import { init, track, setUser, flush, destroy } from '@beacon/sdk'

init({ appId: 'my-app', serverUrl: '/api' })
track('purchase', { amount: 100 })
```

**数据流：**
```
用户行为 → track() → Buffer 缓冲 → 定时/定量上报 → Server /api/collect
```

### 2. Server (`packages/server`)
Node.js 后端服务，接收打点数据并提供查询 API。

**核心文件：**
- `src/index.ts` - 服务入口
- `src/app.ts` - Fastify 实例配置
- `src/routes/collect.ts` - 数据收集接口 `POST /api/collect`
- `src/routes/stats.ts` - 统计接口 `GET /api/stats/*`
- `src/routes/events.ts` - 事件查询 `GET /api/events`
- `src/db/clickhouse.ts` - ClickHouse 连接和表初始化
- `src/config.ts` - 环境配置

**API 路由：**
| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/collect` | POST | 接收 SDK 上报的事件 |
| `/api/events` | GET | 查询事件列表（支持分页、时间筛选） |
| `/api/stats/pv` | GET | PV 统计 |
| `/api/stats/uv` | GET | UV 统计 |
| `/api/stats/users` | GET | 用户分布 |
| `/api/dashboards` | CRUD | 仪表盘管理 |

### 3. Web (`packages/web`)
React 可视化面板，展示分析数据。

**核心文件：**
- `src/App.tsx` - 路由配置
- `src/pages/Overview.tsx` - 总览页面（PV/UV 图表）
- `src/pages/Events.tsx` - 事件列表
- `src/pages/Trend.tsx` - 趋势分析
- `src/components/Layout.tsx` - 布局组件
- `src/api/` - API 调用层

**页面结构：**
```
/              → Overview (总览)
/events        → Events (事件列表)
/trend         → Trend (趋势分析)
```

### 4. Shared (`packages/shared`)
TypeScript 类型定义，供 SDK 和 Server 共用。

**核心类型：**
```typescript
interface TrackEvent {
  event_id: string
  event_name: string
  properties?: Record<string, unknown>
  timestamp: number
  user_id?: string
  session_id: string
  page_url: string
  referrer?: string
  user_agent?: string
}

interface CollectPayload {
  events: TrackEvent[]
  sdk_version: string
  app_id: string
}
```

## 数据流详解

### 1. 打点上报流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
│  ┌─────────┐    ┌──────────┐    ┌──────┐    ┌────────┐         │
│  │ 页面访问 │───▶│ AutoTrack │───▶│Buffer│───▶│Transport│         │
│  └─────────┘    └──────────┘    └──────┘    └────────┘         │
│       │              │                            │            │
│       ▼              ▼                            ▼            │
│  pageview      手动 track()              POST /api/collect        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server (Fastify)                            │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐         │
│  │ /api/collect │──▶│  Validation │──▶│ ClickHouse.insert │      │
│  └────────────┘    └────────────┘    └────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ClickHouse (analytics)                      │
│                                                                 │
│  events 表 (MergeTree 引擎)                                      │
│  - event_id, event_name, properties (JSON)                      │
│  - timestamp, user_id, session_id                               │
│  - page_url, referrer, user_agent, app_id                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 数据查询流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      Web (React)                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                      │
│  │  ECharts │◀──│  API 层 │◀──│  用户操作 │                      │
│  └─────────┘    └─────────┘    └─────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server                                      │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐         │
│  │ /api/stats/* │──▶│ SQL Builder│──▶│ ClickHouse.query│        │
│  └────────────┘    └────────────┘    └────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 技术选型

| 模块 | 技术 | 原因 |
|------|------|------|
| 前端 SDK | 原生 JS（ESM） | 零依赖，轻量化，任意框架可用 |
| 后端 | Fastify 5 | 高性能，TypeScript 原生支持 |
| 事件存储 | ClickHouse | 时序数据写入快，聚合查询强 |
| 元数据存储 | SQLite + Drizzle | 轻量，仪表盘配置够用 |
| 可视化 | React + ECharts | 灵活图表，生态成熟 |
| 样式 | Tailwind CSS | 快速开发，原子化 |

## 环境配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | Server 端口 |
| `CLICKHOUSE_URL` | http://localhost:8123 | ClickHouse HTTP 接口 |
| `CLICKHOUSE_DB` | analytics | 数据库名 |
| `MOCK_MODE` | false | 是否启用 mock 模式 |

## 部署架构

```
                    ┌──────────┐
                    │  Nginx   │
                    │ (反向代理)│
                    └────┬─────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
     ┌────────────┐            ┌────────────┐
     │   Web 3000  │            │ Server 3001 │
     │ (静态资源)   │            │   (API)     │
     └────────────┘            └──────┬───────┘
                                      │
                                      ▼
                               ┌────────────┐
                               │ ClickHouse │
                               │  (数据存储)  │
                               └────────────┘
```

- Web 服务处理前端静态资源，通过 proxy 访问 Server API
- Server 处理业务逻辑，连接 ClickHouse 读写数据
- ClickHouse 存储海量事件数据，支持快速聚合查询

## 扩展方向

1. **实时监控** - WebSocket 推送实时数据
2. **用户行为漏斗** - 转化率分析
3. **留存分析** - 用户留存、流失
4. **A/B 测试** - 实验分组对比
5. **告警系统** - 异常数据自动告警