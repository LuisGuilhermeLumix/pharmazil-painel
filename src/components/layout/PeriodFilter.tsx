import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { PERIOD_LABELS, type Period, type PeriodPreset } from '@/lib/dates'
import { cn } from '@/lib/utils'

const PRESETS: PeriodPreset[] = ['hoje', 'ontem', '7dias', 'mes', 'custom', 'tudo']

export const PILL_BASE =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.06]'
export const PILL_ACTIVE = 'border-[#80d7f8]/50 bg-[#80d7f8]/10 text-[#80d7f8] hover:bg-[#80d7f8]/15'

interface PeriodFilterProps {
  value: Period
  onChange: (p: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => {
        const active = value.preset === p
        if (p === 'custom') {
          return (
            <div key={p} ref={wrap} className="relative">
              <button
                type="button"
                onClick={() => {
                  onChange({ ...value, preset: 'custom' })
                  setOpen((o) => !o)
                }}
                className={cn(PILL_BASE, active && PILL_ACTIVE)}
              >
                <Calendar size={14} />
                {PERIOD_LABELS[p]}
                <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="absolute top-full right-0 z-20 mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111113] p-3 text-xs text-gray-400 shadow-xl">
                  <input
                    type="date"
                    value={value.from ?? ''}
                    max={value.to || undefined}
                    onChange={(e) => onChange({ ...value, preset: 'custom', from: e.target.value })}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white [color-scheme:dark]"
                  />
                  <span>até</span>
                  <input
                    type="date"
                    value={value.to ?? ''}
                    min={value.from || undefined}
                    onChange={(e) => onChange({ ...value, preset: 'custom', to: e.target.value })}
                    className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white [color-scheme:dark]"
                  />
                </div>
              )}
            </div>
          )
        }
        return (
          <button
            key={p}
            type="button"
            onClick={() => {
              onChange({ ...value, preset: p })
              setOpen(false)
            }}
            className={cn(PILL_BASE, active && PILL_ACTIVE)}
          >
            {PERIOD_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}
