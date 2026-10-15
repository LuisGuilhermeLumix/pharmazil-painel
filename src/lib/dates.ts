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
