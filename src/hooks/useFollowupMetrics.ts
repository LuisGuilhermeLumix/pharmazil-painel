import { useMemo } from 'react'
import { chunk, fetchAll, supabase } from '@/lib/supabase'
import {
  dayKey,
  eachDayKey,
  isoToDayKey,
  parseDayKey,
  resolvePeriod,
  type DayKey,
  type Period,
} from '@/lib/dates'
import { pctOf } from '@/lib/format'
import type { Conversa, Followup, FollowupMetricasView, FollowupStatus, Instancia } from '@/types/db'
import { useAsync } from './useAsync'

export interface FollowupRow {
  id: number
  conversation_id: number
  enviado_em: string
  respondeu_em: string | null
  lead: string
  telefone: string | null
  atendente: string
  etapa: number
  status: FollowupStatus
  mensagem: string
}

export interface BreakdownItem {
  label: string
  value: number
  color: string
  /** texto alternativo para exibir no lugar do valor (ex.: "12,5%") */
  display?: string
}

export interface ChartPoint {
  day: DayKey
  enviados: number
  recuperados: number
}

export interface FollowupMetrics {
  leadsEmFollowup: number
  enviados: number
  recuperados: number
  taxa: number
  porEtapa: BreakdownItem[]
  enviadosPorAtendente: BreakdownItem[]
  recuperadosPorEtapa: BreakdownItem[]
  taxaPorAtendente: BreakdownItem[]
  chart: ChartPoint[]
  rows: FollowupRow[]
  /** métricas all-time por instância (da view) */
  view: FollowupMetricasView[]
  instancias: Instancia[]
}

interface RawData {
  followups: Followup[]
  conversas: Map<number, Conversa>
  instancias: Instancia[]
  view: FollowupMetricasView[]
}

const ETAPA_COLORS = ['#80d7f8', '#e65ff5', '#f59e0b', '#f97316', '#22c55e']
const ATENDENTE_COLORS = ['#80d7f8', '#e65ff5', '#22c55e', '#f59e0b', '#f97316', '#ef4444', '#6b7280']

async function fetchRaw(period: Period): Promise<RawData> {
  const range = resolvePeriod(period)

  const followupsPromise = fetchAll<Followup>(() => {
    let q = supabase.from('pharmazil_followups').select('*').order('enviado_em', { ascending: false })
    if (range) q = q.gte('enviado_em', range.startIso).lt('enviado_em', range.endIso)
    return q
  })

  const instanciasPromise = supabase
    .from('pharmazil_instancias')
    .select('*')
    .order('nome', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw new Error(error.message)
      return (data ?? []) as Instancia[]
    })

  const viewPromise = supabase
    .from('pharmazil_v_followup_metricas')
    .select('*')
    .then(({ data, error }) => {
      if (error) throw new Error(error.message)
      return (data ?? []) as FollowupMetricasView[]
    })

  const [followups, instancias, view] = await Promise.all([followupsPromise, instanciasPromise, viewPromise])

  const ids = Array.from(new Set(followups.map((f) => f.conversation_id)))
  const conversas = new Map<number, Conversa>()
  for (const block of chunk(ids, 300)) {
    const { data, error } = await supabase
      .from('pharmazil_conversas')
      .select(
        'conversation_id, contact_id, inbox_id, contato_nome, contato_telefone, status, followup_etapa, followup_status, ultima_msg_de, ultima_msg_em, ultima_msg_texto, followup_proximo_em, followup_motivo, criado_em, atualizado_em',
      )
      .in('conversation_id', block)
    if (error) throw new Error(error.message)
    for (const c of (data ?? []) as Conversa[]) conversas.set(c.conversation_id, c)
  }

  return { followups, conversas, instancias, view }
}

function computeMetrics(raw: RawData, period: Period): FollowupMetrics {
  const { followups, conversas, instancias, view } = raw
  const range = resolvePeriod(period)

  const byInbox = new Map<number, Instancia>()
  const byInstancia = new Map<string, Instancia>()
  for (const i of instancias) {
    byInbox.set(i.inbox_id, i)
    byInstancia.set(i.instancia, i)
  }

  const atendenteDe = (f: Followup): string => {
    const i =
      (f.inbox_id != null ? byInbox.get(f.inbox_id) : undefined) ??
      (f.instancia ? byInstancia.get(f.instancia) : undefined)
    return i?.nome ?? f.instancia ?? 'Desconhecido'
  }

  const rows: FollowupRow[] = followups.map((f) => {
    const c = conversas.get(f.conversation_id)
    return {
      id: f.id,
      conversation_id: f.conversation_id,
      enviado_em: f.enviado_em,
      respondeu_em: f.respondeu_em,
      lead: c?.contato_nome?.trim() || `Conversa #${f.conversation_id}`,
      telefone: c?.contato_telefone ?? null,
      atendente: atendenteDe(f),
      etapa: f.etapa,
      status: c?.followup_status ?? (f.respondeu_em ? 'respondeu' : 'em_andamento'),
      mensagem: f.mensagem ?? '',
    }
  })

  // --- cards ---------------------------------------------------------------
  const leads = new Set<number>()
  const recuperadosSet = new Set<number>()
  const porEtapaMap = new Map<number, number>()
  const recuperadosPorEtapaMap = new Map<number, number>()
  const enviadosPorAtendenteMap = new Map<string, number>()
  const leadsPorAtendente = new Map<string, Set<number>>()
  const recuperadosPorAtendente = new Map<string, Set<number>>()

  for (const r of rows) {
    leads.add(r.conversation_id)
    porEtapaMap.set(r.etapa, (porEtapaMap.get(r.etapa) ?? 0) + 1)
    enviadosPorAtendenteMap.set(r.atendente, (enviadosPorAtendenteMap.get(r.atendente) ?? 0) + 1)
    if (!leadsPorAtendente.has(r.atendente)) leadsPorAtendente.set(r.atendente, new Set())
    leadsPorAtendente.get(r.atendente)!.add(r.conversation_id)
    if (r.respondeu_em) {
      if (!recuperadosSet.has(r.conversation_id)) {
        recuperadosSet.add(r.conversation_id)
        recuperadosPorEtapaMap.set(r.etapa, (recuperadosPorEtapaMap.get(r.etapa) ?? 0) + 1)
      }
      if (!recuperadosPorAtendente.has(r.atendente)) recuperadosPorAtendente.set(r.atendente, new Set())
      recuperadosPorAtendente.get(r.atendente)!.add(r.conversation_id)
    }
  }

  let leadsEmFollowup = leads.size
  let enviados = rows.length
  let recuperados = recuperadosSet.size

  // Período "Tudo": os totais vêm da view (all-time), que é a fonte oficial.
  if (period.preset === 'tudo' && view.length > 0) {
    leadsEmFollowup = view.reduce((s, v) => s + (v.leads_em_followup ?? 0), 0)
    enviados = view.reduce((s, v) => s + (v.total_enviados ?? 0), 0)
    recuperados = view.reduce((s, v) => s + (v.leads_recuperados ?? 0), 0)
  }

  const taxa = pctOf(recuperados, leadsEmFollowup)

  const etapas = Array.from(new Set([1, 2, 3, ...porEtapaMap.keys()])).sort((a, b) => a - b)
  const porEtapa: BreakdownItem[] = etapas.map((e, i) => ({
    label: `Etapa ${e}`,
    value: porEtapaMap.get(e) ?? 0,
    color: ETAPA_COLORS[i % ETAPA_COLORS.length],
  }))
  const recuperadosPorEtapa: BreakdownItem[] = etapas.map((e, i) => ({
    label: `Etapa ${e}`,
    value: recuperadosPorEtapaMap.get(e) ?? 0,
    color: ETAPA_COLORS[i % ETAPA_COLORS.length],
  }))

  const atendentes = Array.from(
    new Set([...instancias.map((i) => i.nome), ...enviadosPorAtendenteMap.keys()]),
  )
  const enviadosPorAtendente: BreakdownItem[] = atendentes.map((a, i) => ({
    label: a,
    value: enviadosPorAtendenteMap.get(a) ?? 0,
    color: ATENDENTE_COLORS[i % ATENDENTE_COLORS.length],
  }))
  const taxaPorAtendente: BreakdownItem[] = atendentes.map((a, i) => {
    const l = leadsPorAtendente.get(a)?.size ?? 0
    const r = recuperadosPorAtendente.get(a)?.size ?? 0
    const t = pctOf(r, l)
    return {
      label: a,
      value: t,
      display: `${t.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
      color: ATENDENTE_COLORS[i % ATENDENTE_COLORS.length],
    }
  })

  // --- gráfico (por dia em America/Sao_Paulo) -----------------------------
  const enviadosDia = new Map<DayKey, number>()
  const recuperadosDia = new Map<DayKey, Set<number>>()
  for (const r of rows) {
    const k = isoToDayKey(r.enviado_em)
    enviadosDia.set(k, (enviadosDia.get(k) ?? 0) + 1)
    if (r.respondeu_em) {
      if (!recuperadosDia.has(k)) recuperadosDia.set(k, new Set())
      recuperadosDia.get(k)!.add(r.conversation_id)
    }
  }

  let days: DayKey[] = []
  if (range) {
    days = eachDayKey(range.startDay, range.endDay)
  } else if (enviadosDia.size > 0) {
    const keys = Array.from(enviadosDia.keys()).sort()
    const first = parseDayKey(keys[0])
    const last = parseDayKey(keys[keys.length - 1])
    if (first && last) days = eachDayKey(first, last)
  }
  const chart: ChartPoint[] = days.map((day) => ({
    day,
    enviados: enviadosDia.get(day) ?? 0,
    recuperados: recuperadosDia.get(day)?.size ?? 0,
  }))

  return {
    leadsEmFollowup,
    enviados,
    recuperados,
    taxa,
    porEtapa,
    enviadosPorAtendente,
    recuperadosPorEtapa,
    taxaPorAtendente,
    chart,
    rows,
    view,
    instancias,
  }
}

export function useFollowupMetrics(period: Period) {
  const key = `${period.preset}|${period.from ?? ''}|${period.to ?? ''}|${dayKey(
    // inclui o dia atual na chave para refazer a consulta quando virar o dia
    (() => {
      const r = resolvePeriod(period)
      return r ? r.endDay : { y: 0, m: 0, d: 0 }
    })(),
  )}`
  const state = useAsync<RawData>(() => fetchRaw(period), [key])
  const metrics = useMemo(
    () => (state.data ? computeMetrics(state.data, period) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.data, key],
  )
  return { ...state, metrics }
}
