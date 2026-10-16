/**
 * Utilitário central de datas do painel.
 *
 * Regras:
 * - Todas as colunas timestamptz chegam como ISO em UTC.
 * - Formatação sempre via Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).
 * - Nunca `.slice(0,10)` em strings UTC, nunca parseISO em labels, nunca concatenar 'Z'.
 * - Filtros de período: intervalo [inicio, fim) construído em America/Sao_Paulo e
 *   convertido para ISO UTC antes de ir ao Supabase.
 */

export const TZ = 'America/Sao_Paulo'

export type DayParts = { y: number; m: number; d: number }

/** Chave de dia no formato yyyy-mm-dd (em America/Sao_Paulo). */
export type DayKey = string

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  day: '2-digit',
  month: '2-digit',
})

type ZonedParts = DayParts & { h: number; mi: number; s: number }

function zonedParts(date: Date): ZonedParts {
  const parts = partsFormatter.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '0')
  return {
    y: get('year'),
    m: get('month'),
    d: get('day'),
    h: get('hour'),
    mi: get('minute'),
    s: get('second'),
  }
}

/** Diferença (ms) entre a hora "de parede" em SP e o UTC para um instante. */
function tzOffsetMs(date: Date): number {
  const p = zonedParts(date)
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s)
  return asUtc - Math.floor(date.getTime() / 1000) * 1000
}

/** Converte uma hora "de parede" em America/Sao_Paulo para um Date (instante UTC). */
export function zonedToUtc(day: DayParts, hour = 0, minute = 0): Date {
  const guess = new Date(Date.UTC(day.y, day.m - 1, day.d, hour, minute, 0, 0))
  const offset = tzOffsetMs(guess)
  const utc = new Date(guess.getTime() - offset)
  const offset2 = tzOffsetMs(utc)
  return offset2 === offset ? utc : new Date(guess.getTime() - offset2)
}

/** Dia (em SP) correspondente a um instante. */
export function toDayParts(date: Date): DayParts {
  const p = zonedParts(date)
  return { y: p.y, m: p.m, d: p.d }
}

export function todaySP(): DayParts {
  return toDayParts(new Date())
}

export function addDays(day: DayParts, n: number): DayParts {
  const t = new Date(Date.UTC(day.y, day.m - 1, day.d + n))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

export function startOfMonth(day: DayParts): DayParts {
  return { y: day.y, m: day.m, d: 1 }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(day: DayParts): DayKey {
  return `${day.y}-${pad(day.m)}-${pad(day.d)}`
}

/** Faz o parse de uma chave yyyy-mm-dd (vinda de um <input type="date">). */
export function parseDayKey(key: string): DayParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

/** Chave de dia (SP) de um timestamptz ISO vindo do banco. */
export function isoToDayKey(iso: string): DayKey {
  return dayKey(toDayParts(new Date(iso)))
}

/** Label curto "dd/mm" a partir de uma chave de dia (sem parse de Date). */
export function dayKeyLabel(key: DayKey): string {
  const p = parseDayKey(key)
  return p ? `${pad(p.d)}/${pad(p.m)}` : key
}

const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']

/** Label "01 de out." a partir de uma chave de dia (sem parse de Date). */
export function dayKeyChartLabel(key: DayKey): string {
  const p = parseDayKey(key)
  return p ? `${pad(p.d)} de ${MONTHS_SHORT[p.m - 1] ?? p.m}` : key
}

/** Label "dd/mm/yyyy" a partir de uma chave de dia (sem parse de Date). */
export function dayKeyLongLabel(key: DayKey): string {
  const p = parseDayKey(key)
  return p ? `${pad(p.d)}/${pad(p.m)}/${p.y}` : key
}

/** Lista de chaves de dia de `start` até `end` (inclusive). */
export function eachDayKey(start: DayParts, end: DayParts): DayKey[] {
  const out: DayKey[] = []
  let cur = start
  const endKey = dayKey(end)
  for (let i = 0; i < 2000; i++) {
    const k = dayKey(cur)
    out.push(k)
    if (k >= endKey) break
    cur = addDays(cur, 1)
  }
  return out
}

/** Formata um timestamptz ISO como "dd/mm/yyyy HH:mm" em SP. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}

/** Formata um timestamptz ISO como "dd/mm/yyyy" em SP. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return dateFormatter.format(new Date(iso))
}

/** Formata um timestamptz ISO como "dd/mm" em SP. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return shortDateFormatter.format(new Date(iso))
}

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Formata um timestamptz ISO como "HH:mm" em SP. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return timeFormatter.format(new Date(iso))
}

/** "15 de out. às 10:00" (em SP). */
export function formatAgendado(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${dayKeyChartLabel(isoToDayKey(iso))} às ${formatTime(iso)}`
}

/** "15/10 16:48" em SP. */
export function formatShortDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${formatShortDate(iso)} ${formatTime(iso)}`
}

/** "Hoje 00:25" ou "16/10 00:25" em SP. */
export function formatAgendadoShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return `${isTodaySP(iso) ? 'Hoje' : formatShortDate(iso)} ${formatTime(iso)}`
}

export function isTodaySP(iso: string): boolean {
  return isoToDayKey(iso) === dayKey(todaySP())
}

/**
 * Converte data (yyyy-mm-dd) + hora (HH:mm) "de parede" em America/Sao_Paulo
 * para ISO UTC. Nunca use `new Date('YYYY-MM-DDTHH:mm')`, que usa o fuso do navegador.
 */
export function spLocalToUtcIso(date: string, time: string): string {
  const d = parseDayKey(date)
  const m = /^(\d{2}):(\d{2})$/.exec(time)
  if (!d || !m) throw new Error('Data ou hora inválida')
  return zonedToUtc(d, Number(m[1]), Number(m[2])).toISOString()
}

// ---------------------------------------------------------------------------
// Calendário mensal
// ---------------------------------------------------------------------------

export type YearMonth = { y: number; m: number }

export function currentYearMonth(): YearMonth {
  const t = todaySP()
  return { y: t.y, m: t.m }
}

export function shiftMonth(ym: YearMonth, n: number): YearMonth {
  const t = new Date(Date.UTC(ym.y, ym.m - 1 + n, 1))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 }
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' })

/** "Outubro de 2026" */
export function monthLabel(ym: YearMonth): string {
  const s = monthFormatter.format(new Date(Date.UTC(ym.y, ym.m - 1, 15)))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Intervalo [inicio, fim) do mês em UTC, construído em SP. */
export function monthRangeIso(ym: YearMonth): { startIso: string; endIso: string } {
  const next = shiftMonth(ym, 1)
  return {
    startIso: zonedToUtc({ y: ym.y, m: ym.m, d: 1 }).toISOString(),
    endIso: zonedToUtc({ y: next.y, m: next.m, d: 1 }).toISOString(),
  }
}

export type CalendarCell = { key: DayKey; day: number; inMonth: boolean }

/** Grade do mês: semanas (domingo a sábado) com dias vizinhos preenchendo as pontas. */
export function calendarGrid(ym: YearMonth): CalendarCell[][] {
  const first: DayParts = { y: ym.y, m: ym.m, d: 1 }
  const firstWeekday = new Date(Date.UTC(ym.y, ym.m - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(ym.y, ym.m, 0)).getUTCDate()
  const start = addDays(first, -firstWeekday)
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const weeks: CalendarCell[][] = []
  for (let i = 0; i < totalCells; i++) {
    const d = addDays(start, i)
    if (i % 7 === 0) weeks.push([])
    weeks[weeks.length - 1].push({ key: dayKey(d), day: d.d, inMonth: d.m === ym.m && d.y === ym.y })
  }
  return weeks
}

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ---------------------------------------------------------------------------
// Período
// ---------------------------------------------------------------------------

export type PeriodPreset = 'hoje' | 'ontem' | '7dias' | 'mes' | 'custom' | 'tudo'

export type Period = {
  preset: PeriodPreset
  /** usados apenas em `custom` (yyyy-mm-dd) */
  from?: string
  to?: string
}

export type PeriodRange = {
  /** ISO UTC, inclusivo */
  startIso: string
  /** ISO UTC, exclusivo */
  endIso: string
  /** primeiro dia (SP) */
  startDay: DayParts
  /** último dia (SP), inclusivo */
  endDay: DayParts
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  '7dias': '7 dias',
  mes: 'Este mês',
  custom: 'Customizado',
  tudo: 'Tudo',
}

/**
 * Resolve o período em um intervalo [inicio, fim) em UTC.
 * Devolve `null` para "tudo" (sem filtro) ou para um customizado incompleto.
 */
export function resolvePeriod(period: Period, now = new Date()): PeriodRange | null {
  const today = toDayParts(now)
  let startDay: DayParts
  let endDay: DayParts

  switch (period.preset) {
    case 'hoje':
      startDay = today
      endDay = today
      break
    case 'ontem':
      startDay = addDays(today, -1)
      endDay = startDay
      break
    case '7dias':
      startDay = addDays(today, -6)
      endDay = today
      break
    case 'mes':
      startDay = startOfMonth(today)
      endDay = today
      break
    case 'custom': {
      const from = period.from ? parseDayKey(period.from) : null
      const to = period.to ? parseDayKey(period.to) : null
      if (!from || !to) return null
      startDay = from
      endDay = to
      if (dayKey(endDay) < dayKey(startDay)) [startDay, endDay] = [endDay, startDay]
      break
    }
    case 'tudo':
      return null
  }

  return {
    startDay,
    endDay,
    startIso: zonedToUtc(startDay).toISOString(),
    endIso: zonedToUtc(addDays(endDay, 1)).toISOString(),
  }
}
