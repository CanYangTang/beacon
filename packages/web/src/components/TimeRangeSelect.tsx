import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimeRangeSelectProps {
  value: string
  onChange: (range: { startTime: number; endTime: number; label: string }) => void
}

const RANGES = [
  { label: '最近1小时', ms: 60 * 60 * 1000 },
  { label: '今天', ms: 0 },
  { label: '最近7天', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '最近30天', ms: 30 * 24 * 60 * 60 * 1000 },
]

function getTodayStart() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.getTime()
}

export default function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  const handleChange = (label: string) => {
    const range = RANGES.find((r) => r.label === label)
    if (!range) return
    const now = Date.now()
    const startTime = range.ms === 0 ? getTodayStart() : now - range.ms
    onChange({ startTime, endTime: now, label })
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGES.map((r) => (
          <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
