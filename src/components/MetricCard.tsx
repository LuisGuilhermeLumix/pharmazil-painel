import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { BreakdownItem } from '@/hooks/useFollowupMetrics'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: ReactNode
  /** cor do valor (hex) */
  color?: string
  subtitle?: string
  breakdown?: BreakdownItem[]
  loading?: boolean
  className?: string
}

export function MetricCard({ label, value, color, subtitle, breakdown, loading, className }: MetricCardProps) {
  return (
    <div className={cn('flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-6', className)}>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-9 w-24 bg-white/10" />
          <Skeleton className="h-3 w-32 bg-white/5" />
        </div>
      ) : (
        <>
          <div className="mt-2 text-3xl font-bold tracking-tight" style={{ color: color ?? '#ffffff' }}>
            {value}
          </div>
          {subtitle && <div className="mt-1 text-xs text-gray-400">{subtitle}</div>}
        </>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4">
          {loading
            ? breakdown.slice(0, 3).map((_, i) => <Skeleton key={i} className="h-3 w-full bg-white/5" />)
            : breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="truncate text-gray-400">{b.label}</span>
                  </div>
                  <span className="ml-3 shrink-0 font-medium text-gray-200">{b.display ?? formatInt(b.value)}</span>
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
