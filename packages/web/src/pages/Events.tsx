import { useEffect, useState } from 'react'
import TimeRangeSelect from '@/components/TimeRangeSelect'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { fetchEvents } from '@/api'
import type { TrackEvent } from '@beacon/shared'

export default function Events() {
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [eventName, setEventName] = useState('')
  const [timeRange, setTimeRange] = useState({ label: '今天', startTime: 0, endTime: Date.now() })
  const pageSize = 20

  useEffect(() => {
    const now = Date.now()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setTimeRange({ label: '今天', startTime: today.getTime(), endTime: now })
  }, [])

  useEffect(() => {
    if (!timeRange.startTime) return
    fetchEvents({
      eventName: eventName || undefined,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      page,
      pageSize,
    })
      .then((data) => { setEvents(data.items); setTotal(data.total) })
      .catch(console.error)
  }, [page, eventName, timeRange])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">事件列表</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          className="w-48"
          placeholder="筛选事件名"
          value={eventName}
          onChange={(e) => { setEventName(e.target.value); setPage(1) }}
        />
        <TimeRangeSelect value={timeRange.label} onChange={(r) => { setTimeRange(r); setPage(1) }} />
        <span className="text-sm text-muted-foreground">共 {total} 条</span>
      </div>

      {events.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>事件名</TableHead>
                    <TableHead>用户ID</TableHead>
                    <TableHead>页面地址</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>属性</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.event_id}>
                      <TableCell className="font-medium">{event.event_name}</TableCell>
                      <TableCell>{event.user_id || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{event.page_url}</TableCell>
                      <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {typeof event.properties === 'string' ? event.properties : JSON.stringify(event.properties)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              下一页
            </Button>
          </div>
        </>
      ) : (
        <p className="text-center py-16 text-sm text-muted-foreground">暂无事件数据</p>
      )}
    </div>
  )
}
