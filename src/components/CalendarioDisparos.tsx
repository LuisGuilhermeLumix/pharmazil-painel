import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ENVIO_STATUS_COLOR, EnvioStatusBadge } from '@/components/StatusBadge'
import { fetchCalendario } from '@/hooks/useEnvios'
import { useAsync } from '@/hooks/useAsync'
import {
  WEEKDAYS_SHORT,
  calendarGrid,
  currentYearMonth,
  dayKey,
  dayKeyChartLabel,
  formatTime,
  isoToDayKey,
  monthLabel,
  shiftMonth,
  todaySP,
  type DayKey,
} from '@/lib/dates'
import { shortName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Envio, Instancia } from '@/types/db'

const MAX_DOTS = 3
const MAX_TOOLTIP_ROWS = 8

interface CalendarioDisparosProps {
  instancias: Instancia[]
  selectedDay: DayKey | null
  onSelectDay: (day: DayKey | null) => void
  /** incrementa para recarregar o mês após envio/cancelamento */
  refreshKey: number
}

const NAV_BTN =
  'inline-flex h-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.06]'

export function CalendarioDisparos({ instancias, selectedDay, onSelectDay, refreshKey }: CalendarioDisparosProps) {
  const [ym, setYm] = useState(currentYearMonth)
  const { data, loading, error } = useAsync<Envio[]>(() => fetchCalendario(ym), [ym.y, ym.m, refreshKey])
  const nomePorInstancia = useMemo(() => new Map(instancias.map((i) => [i.instancia, i.nome])), [instancias])

  const porDia = useMemo(() => {
    const m = new Map<DayKey, Envio[]>()
    for (const e of data ?? []) {
      if (!e.agendado_para) continue
      const k = isoToDayKey(e.agendado_para)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(e)
    }
    return m
  }, [data])

  const weeks = useMemo(() => calendarGrid(ym), [ym])
  const hojeKey = dayKey(todaySP())

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Calendário de disparos</h3>
          <p className="text-xs text-gray-500">Clique em um dia para filtrar os agendados</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setYm((v) => shiftMonth(v, -1))} className={NAV_BTN} aria-label="Mês anterior">
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium text-white">{monthLabel(ym)}</span>
          <button type="button" onClick={() => setYm((v) => shiftMonth(v, 1))} className={NAV_BTN} aria-label="Próximo mês">
            <ChevronRight size={14} />
          </button>
          <button type="button" onClick={() => setYm(currentYearMonth())} className={NAV_BTN}>
            Hoje
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-[#ef4444]">{error}</p>}

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {d}
          </div>
        ))}
        {loading && !data
          ? Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-white/5" />)
          : weeks.flat().map((cell) => {
              const envios = porDia.get(cell.key) ?? []
              const isToday = cell.key === hojeKey
              const isSelected = cell.key === selectedDay
              const cellEl = (
                <button
                  type="button"
                  onClick={() => onSelectDay(isSelected ? null : cell.key)}
                  className={cn(
                    'flex h-16 w-full flex-col items-start rounded-lg border p-1.5 text-left transition-colors',
                    'border-transparent hover:bg-white/[0.04]',
                    isToday && 'border-[#80d7f8]/40',
                    isSelected && 'bg-white/[0.06]',
                  )}
                >
                  <span className={cn('text-xs tabular-nums', cell.inMonth ? 'text-gray-300' : 'text-gray-700', isToday && 'font-semibold text-[#80d7f8]')}>
                    {cell.day}
                  </span>
                  {envios.length > 0 && (
                    <span className="mt-auto flex items-center gap-1">
                      {envios.slice(0, MAX_DOTS).map((e) => (
                        <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ENVIO_STATUS_COLOR[e.status] ?? '#6b7280' }} />
                      ))}
                      {envios.length > MAX_DOTS && <span className="text-[10px] text-gray-400 tabular-nums">+{envios.length - MAX_DOTS}</span>}
                    </span>
                  )}
                </button>
              )
              if (envios.length === 0) return <div key={cell.key}>{cellEl}</div>
              return (
                <Tooltip key={cell.key}>
                  <TooltipTrigger asChild>{cellEl}</TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    avoidCollisions
                    collisionPadding={16}
                    sideOffset={6}
                    className="block w-[360px] max-w-[360px] rounded-xl p-3 text-xs"
                  >
                    <div className="mb-2 font-medium text-white">{dayKeyChartLabel(cell.key)}</div>
                    <ul className="space-y-1.5">
                      {envios.slice(0, MAX_TOOLTIP_ROWS).map((e) => {
                        const chat = shortName(nomePorInstancia.get(e.instancia) ?? e.instancia)
                        const grupoNome = e.grupo_nome ?? e.grupo_jid
                        return (
                          <li key={e.id} className="flex min-w-0 items-center gap-2">
                            <span className="w-10 shrink-0 whitespace-nowrap text-gray-400 tabular-nums">{formatTime(e.agendado_para)}</span>
                            <span className="w-16 shrink-0 truncate text-gray-400" title={chat}>
                              {chat}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-gray-200" title={grupoNome}>
                              {grupoNome}
                            </span>
                            <span className="shrink-0">
                              <EnvioStatusBadge status={e.status} erro={e.erro} />
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    {envios.length > MAX_TOOLTIP_ROWS && (
                      <div className="mt-2 text-gray-500 tabular-nums">+{envios.length - MAX_TOOLTIP_ROWS} mais</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
        {(['agendado', 'enviado', 'erro', 'cancelado'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ENVIO_STATUS_COLOR[s] }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>
    </Panel>
  )
}
