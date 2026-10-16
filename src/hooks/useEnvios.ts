import { fetchAll, supabase } from '@/lib/supabase'
import type { DisparoPayload, DisparoResponse, Envio } from '@/types/db'
import { sanitizeFileName } from '@/lib/format'
import { monthRangeIso, type YearMonth } from '@/lib/dates'
import { useAsync, usePolling } from './useAsync'

export const ENVIADOS_PAGE = 15
/** Intervalo do polling do histórico (a tabela não está na publication de realtime). */
export const ENVIOS_POLL_MS = 60_000

export interface EnviosData {
  enviados: Envio[]
  agendados: Envio[]
}

/**
 * Histórico concluído: enviado | erro | cancelado, ordenado por coalesce(enviado_em, criado_em) desc.
 * O PostgREST não ordena por coalesce, então busca tudo (paginando) e ordena no client.
 */
export async function fetchEnviados(): Promise<Envio[]> {
  const rows = await fetchAll<Envio>(() =>
    supabase
      .from('pharmazil_envios')
      .select('*')
      .in('status', ['enviado', 'erro', 'cancelado'])
      .order('criado_em', { ascending: false }),
  )
  const t = (e: Envio) => new Date(e.enviado_em ?? e.criado_em).getTime()
  return rows.sort((a, b) => t(b) - t(a))
}

/** Agendados pendentes, do mais próximo ao mais distante. */
export async function fetchAgendados(): Promise<Envio[]> {
  return fetchAll<Envio>(() =>
    supabase
      .from('pharmazil_envios')
      .select('*')
      .eq('status', 'agendado')
      .order('agendado_para', { ascending: true }),
  )
}

export function useEnviosData() {
  const state = useAsync<EnviosData>(async () => {
    const [enviados, agendados] = await Promise.all([fetchEnviados(), fetchAgendados()])
    return { enviados, agendados }
  }, [])
  usePolling(() => void state.refresh(), ENVIOS_POLL_MS)
  return state
}

/** Disparos com agendado_para dentro do mês (todos os status), para o calendário. */
export async function fetchCalendario(ym: YearMonth): Promise<Envio[]> {
  const { startIso, endIso } = monthRangeIso(ym)
  return fetchAll<Envio>(() =>
    supabase
      .from('pharmazil_envios')
      .select('*')
      .gte('agendado_para', startIso)
      .lt('agendado_para', endIso)
      .order('agendado_para', { ascending: true }),
  )
}

/** Quantos disparos já estão agendados para a instância em ±10 min do horário. */
export async function countAgendadosProximos(instancia: string, agendadoIso: string): Promise<number> {
  const t = new Date(agendadoIso).getTime()
  const from = new Date(t - 10 * 60_000).toISOString()
  const to = new Date(t + 10 * 60_000).toISOString()
  const { count, error } = await supabase
    .from('pharmazil_envios')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'agendado')
    .eq('instancia', instancia)
    .gte('agendado_para', from)
    .lte('agendado_para', to)
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Cancela um agendamento. Devolve `false` se nenhuma linha foi afetada
 * (o cron já enviou ou o status mudou).
 */
export async function cancelarEnvio(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('pharmazil_envios')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .eq('status', 'agendado')
    .select('id')
  if (error) throw new Error(error.message)
  return (data?.length ?? 0) > 0
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Faz upload da imagem no bucket `pharmazil` e devolve a URL pública. */
export async function uploadImagemDisparo(file: File): Promise<string> {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `disparos/${Date.now()}-${sanitizeFileName(file.name)}.${ext}`
  const { error } = await supabase.storage.from('pharmazil').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(`Falha no upload da imagem: ${error.message}`)
  const { data } = supabase.storage.from('pharmazil').getPublicUrl(path)
  return data.publicUrl
}

/** Dispara o webhook do n8n (envio imediato ou agendamento). */
export async function enviarDisparo(payload: DisparoPayload): Promise<DisparoResponse> {
  const url = import.meta.env.VITE_N8N_DISPARO_URL
  if (!url) throw new Error('VITE_N8N_DISPARO_URL não configurada.')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  if (!res.ok) {
    const erro =
      body && typeof body === 'object' && 'erro' in body
        ? String((body as { erro: unknown }).erro)
        : `HTTP ${res.status}`
    return { ok: false, erro }
  }
  if (!body || typeof body !== 'object') return { ok: true }
  return body as DisparoResponse
}
