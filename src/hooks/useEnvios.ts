import { supabase } from '@/lib/supabase'
import type { DisparoPayload, DisparoResponse, Envio } from '@/types/db'
import { sanitizeFileName } from '@/lib/format'
import { useAsync } from './useAsync'

export const ENVIOS_PAGE = 25

export interface EnviosPage {
  rows: Envio[]
  total: number
}

/** Página do histórico de disparos (ordenado por criado_em desc). */
export async function fetchEnvios(page: number): Promise<EnviosPage> {
  const from = page * ENVIOS_PAGE
  const { data, error, count } = await supabase
    .from('pharmazil_envios')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(from, from + ENVIOS_PAGE - 1)
  if (error) throw new Error(error.message)
  return { rows: (data ?? []) as Envio[], total: count ?? 0 }
}

export function useEnvios(page: number) {
  return useAsync<EnviosPage>(() => fetchEnvios(page), [page])
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

/** Dispara o webhook do n8n. */
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
