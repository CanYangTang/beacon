# Beacon

前端打点上报 + 可视化分析平台（内部工具）。

## 架构

Monorepo（pnpm workspace + Turborepo），共 4 个子包：

- `packages/shared` — 共享 TypeScript 类型定义
- `packages/sdk` — 前端打点 SDK，提供 track() API，支持批量上报
- `packages/server` — Node.js 后端（Fastify），负责数据收集和查询
- `packages/web` — React 可视化面板（Vite），展示图表和分析数据

## 技术栈

- **语言**: TypeScript (strict mode), ESM
- **后端**: Fastify 5 + ClickHouse (事件存储) + SQLite/Drizzle (元数据)
- **前端**: React 19 + Vite 6 + ECharts
- **构建**: Turborepo, tsup (SDK), tsc (server/shared)
- **测试**: Vitest
- **包管理**: pnpm 9

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动本地 ClickHouse
pnpm db:up

# 写入模拟数据（5000条，7天跨度）
pnpm db:seed

# 启动全部服务（server:3001, web:3000）
pnpm dev

# 构建全部包
pnpm build

# 运行测试
pnpm test

# 格式化代码
pnpm format

# 关闭 ClickHouse
pnpm db:down
```

## 快速开始

```bash
pnpm install
pnpm db:up          # 启动 ClickHouse
pnpm db:seed        # 写入模拟数据
pnpm dev            # 启动开发服务
# 浏览器打开 http://localhost:3000
```

## 端口

| 服务 | 端口 |
|------|------|
| Web 前端 | 3000 |
| API 服务 | 3001 |
| ClickHouse HTTP | 8123 |
| ClickHouse Native | 9000 |

## API 约定

- 所有 API 路由以 `/api/` 开头
- 响应格式统一: `{ code: number, data: T, message: string }`
- 数据收集: `POST /api/collect`
- 查询接口: `GET /api/events`, `GET /api/stats/*`
- 仪表盘管理: `/api/dashboards` CRUD
- 前端开发服务 proxy `/api` 到后端 3001 端口

## ClickHouse 表结构

主表 `events`:
- event_id (String) — UUID
- event_name (String) — 事件名
- properties (String) — JSON 格式属性
- timestamp (DateTime64(3)) — 事件时间
- user_id (String) — 用户标识
- session_id (String) — 会话标识
- page_url (String) — 页面地址
- referrer (String) — 来源页面
- user_agent (String) — UA
- app_id (String) — 应用标识
- created_at (DateTime) — 写入时间

引擎: MergeTree, 按 (app_id, event_name, timestamp) 排序

## 代码约定

- 全程 TypeScript strict 模式
- 使用 ESM (import/export)
- 命名: camelCase (变量/函数), PascalCase (类型/组件), snake_case (数据库字段/API参数)
- 不写注释除非解释 why
- 新增 API 接口时同步在 shared 包中定义类型
- Prettier 格式化: 无分号, 单引号, 尾逗号
