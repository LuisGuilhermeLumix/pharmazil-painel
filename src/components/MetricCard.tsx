import { useState, type ReactNode } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { BreakdownItem } from '@/hooks/useFollowupMetrics'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** cor de acento (hex). Sem acento = valor branco e sem brilho. */
  accent?: string
  subtitle?: string
  breakdown?: BreakdownItem[]
  loading?: boolean
  className?: string
}

export function MetricCard({ label, value, icon: Icon, accent, subtitle, breakdown, loading, className }: MetricCardProps) {
  const isMobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const showBreakdown = !isMobile || expanded

  return (
    <Panel accent={accent} className={cn('min-w-0', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</span>
        {Icon && <Icon size={16} className="text-gray-500" />}
      </div>

      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-9 w-24 bg-white/10" />
          <Skeleton className="h-3 w-32 bg-white/5" />
        </div>
      ) : (
        <>
          <div
            className="mt-3 text-3xl leading-none font-bold tracking-tight tabular-nums lg:text-4xl"
            style={{ color: accent ?? '#ffffff' }}
          >
            {value}
          </div>
          {subtitle && <div className="mt-1.5 text-xs text-gray-500">{subtitle}</div>}
        </>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-4 border-t border-white/[0.08] pt-3">
          {/* mobile: colapsado por padrão */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="-my-1 flex h-10 w-full items-center justify-between text-xs text-gray-400"
            >
              <span>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
              <ChevronDown size={14} className={cn('transition-transform', expanded && 'rotate-180')} />
            </button>
          )}
          {showBreakdown &&
            (loading
              ? breakdown.slice(0, 3).map((_, i) => <Skeleton key={i} className="my-1.5 h-3 w-full bg-white/5" />)
              : breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between py-0.5 text-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="truncate text-gray-400">{b.label}</span>
                    </div>
                    <span className="ml-3 shrink-0 font-medium text-gray-200 tabular-nums">
                      {b.display ?? formatInt(b.value)}
                    </span>
                  </div>
                )))}
        </div>
      )}
    </Panel>
  )
}
