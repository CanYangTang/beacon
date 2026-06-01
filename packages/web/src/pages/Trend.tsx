import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import TimeRangeSelect from '@/components/TimeRangeSelect'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchTrend } from '@/api'
import type { TrendPoint } from '@beacon/shared'

export default function Trend() {
  const [data, setData] = useState<TrendPoint[]>([])
  const [eventName, setEventName] = useState('')
  const [granularity, setGranularity] = useState<'hour' | 'day'>('hour')
  const [timeRange, setTimeRange] = useState({ label: '今天', startTime: 0, endTime: Date.now() })

  useEffect(() => {
    const now = Date.now()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setTimeRange({ label: '今天', startTime: today.getTime(), endTime: now })
  }, [])

  useEffect(() => {
    if (!timeRange.startTime) return
    fetchTrend({
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      eventName: eventName || undefined,
      granularity,
    })
      .then(setData)
      .catch(console.error)
  }, [timeRange, eventName, granularity])

  const option = {
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: data.map((d) => d.time),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value' as const },
    series: [
      {
        name: eventName || '全部事件',
        data: data.map((d) => d.count),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
      },
    ],
    grid: { left: 50, right: 20, top: 40, bottom: 60 },
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">趋势分析</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          className="w-52"
          placeholder="事件名（留空=全部）"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <Select value={granularity} onValueChange={(v) => setGranularity(v as 'hour' | 'day')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">按小时</SelectItem>
            <SelectItem value="day">按天</SelectItem>
          </SelectContent>
        </Select>
        <TimeRangeSelect value={timeRange.label} onChange={setTimeRange} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">事件趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ReactECharts option={option} style={{ height: 400 }} />
          ) : (
            <p className="text-center py-16 text-sm text-muted-foreground">暂无趋势数据</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
