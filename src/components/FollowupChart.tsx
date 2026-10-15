import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartPoint } from '@/hooks/useFollowupMetrics'
import { dayKeyChartLabel } from '@/lib/dates'

const SERIES = [
  { key: 'enviados', label: 'Enviados', color: '#80d7f8' },
  { key: 'recuperados', label: 'Recuperados', color: '#22c55e' },
] as const

interface FollowupChartProps {
  data: ChartPoint[]
  loading?: boolean
}

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string
  color?: string
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: unknown }) {
  if (!active || !payload?.length) return null
  const items = payload.filter((p) => SERIES.some((s) => s.key === p.dataKey))
  return (
    <div className="rounded-lg border border-white/10 bg-[#18181b] px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 text-gray-400">{dayKeyChartLabel(String(label))}</div>
      {items.map((p) => {
        const s = SERIES.find((x) => x.key === p.dataKey)
        return (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s?.color }} />
              {s?.label}
            </span>
            <span className="font-medium text-white tabular-nums">{p.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function FollowupChart({ data, loading }: FollowupChartProps) {
  const isEmpty = !loading && data.every((d) => d.enviados === 0 && d.recuperados === 0)

  return (
    <Panel>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Follow-ups ao longo do tempo</h3>
          <p className="text-xs text-gray-500">Follow-ups enviados e leads recuperados por dia</p>
        </div>
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-64">
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
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  {SERIES.map((s) => (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={dayKeyChartLabel}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.12)' }} content={<ChartTooltip />} />
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
    </Panel>
  )
}
