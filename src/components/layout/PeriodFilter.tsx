import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/useIsMobile'
import { PERIOD_LABELS, type Period, type PeriodPreset } from '@/lib/dates'
import { cn } from '@/lib/utils'

const PRESETS: PeriodPreset[] = ['hoje', 'ontem', '7dias', 'mes', 'custom', 'tudo']

export const PILL_BASE =
  'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-gray-300 transition-colors hover:bg-white/[0.06] lg:min-h-0'
export const PILL_ACTIVE = 'border-[#80d7f8]/50 bg-[#80d7f8]/10 text-[#80d7f8] hover:bg-[#80d7f8]/15'

const DATE_INPUT =
  'h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-white [color-scheme:dark] lg:h-8 lg:w-auto'

interface PeriodFilterProps {
  value: Period
  onChange: (p: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  // fecha o popover do desktop ao clicar fora
  useEffect(() => {
    if (!open || isMobile) return
    function onDown(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, isMobile])

  const dateInputs = (
    <>
      <input
        type="date"
        value={value.from ?? ''}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, preset: 'custom', from: e.target.value })}
        aria-label="Data inicial"
        className={DATE_INPUT}
      />
      <span className="text-xs text-gray-400">até</span>
      <input
        type="date"
        value={value.to ?? ''}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, preset: 'custom', to: e.target.value })}
        aria-label="Data final"
        className={DATE_INPUT}
      />
    </>
  )

  return (
    <div className="-mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
      {PRESETS.map((p) => {
        const active = value.preset === p
        if (p === 'custom') {
          return (
            <div key={p} ref={wrap} className="relative shrink-0">
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
                <ChevronDown size={14} className={cn('transition-transform', open && !isMobile && 'rotate-180')} />
              </button>

              {/* desktop: popover ancorado */}
              {open && !isMobile && (
                <div className="absolute top-full right-0 z-20 mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#111113] p-3 shadow-xl">
                  {dateInputs}
                </div>
              )}

              {/* mobile: dialog */}
              {isMobile && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogContent className="rounded-2xl border-white/10 bg-[#111113]">
                    <DialogHeader>
                      <DialogTitle>Período customizado</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">{dateInputs}</div>
                    <DialogFooter className="rounded-b-2xl">
                      <Button onClick={() => setOpen(false)} className="h-10 w-full rounded-lg bg-[#80d7f8] text-[#0a0a0a] hover:bg-[#9ee1fa]">
                        Aplicar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
