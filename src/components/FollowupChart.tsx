import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartPoint } from '@/hooks/useFollowupMetrics'
import { dayKeyLabel, dayKeyLongLabel } from '@/lib/dates'

const SERIES = [
  { key: 'enviados', label: 'Enviados', color: '#80d7f8' },
  { key: 'recuperados', label: 'Recuperados', color: '#22c55e' },
] as const

interface FollowupChartProps {
  data: ChartPoint[]
  loading?: boolean
}

export function FollowupChart({ data, loading }: FollowupChartProps) {
  const isEmpty = !loading && data.every((d) => d.enviados === 0 && d.recuperados === 0)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-white">Follow-ups ao longo do tempo</h3>
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs text-gray-400">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-72">
        {loading ? (
          <Skeleton className="h-full w-full bg-white/5" />
        ) : (
          <>
            {isEmpty && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-gray-500">
                Nenhum follow-up no período
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={dayKeyLabel}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#262626' }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: '#404040', strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#141416',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
                  labelFormatter={(label) => dayKeyLongLabel(String(label))}
                  formatter={(value, name) => [
                    value,
                    SERIES.find((s) => s.key === name)?.label ?? String(name),
                  ]}
                />
                {SERIES.map((s) => (
                  <Area
                    key={`area-${s.key}`}
                    type="monotone"
                    dataKey={s.key}
                    stroke="none"
                    fill={`url(#grad-${s.key})`}
                    isAnimationActive={false}
                    tooltipType="none"
                    legendType="none"
                  />
                ))}
                {SERIES.map((s) => (
                  <Line
                    key={`line-${s.key}`}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
