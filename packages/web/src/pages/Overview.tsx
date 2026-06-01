import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import StatCard from '@/components/StatCard'
import TimeRangeSelect from '@/components/TimeRangeSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchOverview, fetchTrend, fetchTopEvents } from '@/api'
import type { EventOverview, TrendPoint } from '@beacon/shared'

export default function Overview() {
  const [overview, setOverview] = useState<EventOverview | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [topEvents, setTopEvents] = useState<{ event_name: string; count: string }[]>([])
  const [timeRange, setTimeRange] = useState({ label: '今天', startTime: 0, endTime: Date.now() })

  useEffect(() => {
    const now = Date.now()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setTimeRange({ label: '今天', startTime: today.getTime(), endTime: now })
  }, [])

  useEffect(() => {
    if (!timeRange.startTime) return
    const { startTime, endTime } = timeRange
    fetchOverview(startTime, endTime).then(setOverview).catch(console.error)
    fetchTrend({ startTime, endTime, granularity: 'hour' }).then(setTrend).catch(console.error)
    fetchTopEvents({ startTime, endTime, limit: 10 }).then(setTopEvents).catch(console.error)
  }, [timeRange])

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: trend.map((t) => t.time) },
    yAxis: { type: 'value' as const },
    series: [{ data: trend.map((t) => t.count), type: 'line', smooth: true, areaStyle: {} }],
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
  }

  const topOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: topEvents.map((e) => e.event_name) },
    yAxis: { type: 'value' as const },
    series: [{ data: topEvents.map((e) => Number(e.count)), type: 'bar', itemStyle: { color: '#409eff' } }],
    grid: { left: 50, right: 20, top: 20, bottom: 60 },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">概览</h2>
        <TimeRangeSelect value={timeRange.label} onChange={setTimeRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="总事件数" value={overview?.total_events ?? 0} />
        <StatCard label="页面浏览 (PV)" value={overview?.total_pv ?? 0} />
        <StatCard label="独立用户 (UV)" value={overview?.unique_users ?? 0} />
        <StatCard label="事件类型数" value={overview?.top_events?.length ?? 0} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">事件趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length > 0 ? (
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          ) : (
            <p className="text-center py-16 text-sm text-muted-foreground">暂无数据</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">热门事件 Top 10</CardTitle>
        </CardHeader>
        <CardContent>
          {topEvents.length > 0 ? (
            <ReactECharts option={topOption} style={{ height: 300 }} />
          ) : (
            <p className="text-center py-16 text-sm text-muted-foreground">暂无数据</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
