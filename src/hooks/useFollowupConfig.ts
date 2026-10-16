import { supabase } from '@/lib/supabase'
import type { FollowupConfig } from '@/types/db'
import { useAsync } from './useAsync'

export async function fetchFollowupConfig(): Promise<FollowupConfig | null> {
  const { data, error } = await supabase
    .from('pharmazil_followup_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const row = data as FollowupConfig | null
  if (!row) return null
  return { ...row, etapas_horas: normalizeEtapas(row.etapas_horas) }
}

/** Garante uma lista válida de horas (1 a 5 inteiros >= 1). */
export function normalizeEtapas(raw: unknown): number[] {
  const arr = Array.isArray(raw) ? raw.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v >= 1) : []
  return arr.length ? arr.slice(0, 5).map((v) => Math.round(v)) : [24]
}

export function useFollowupConfig() {
  return useAsync<FollowupConfig | null>(fetchFollowupConfig, [])
}

/** Campos editáveis. `max_etapas` é coluna gerada e NUNCA deve ser enviada. */
export type FollowupConfigInput = Pick<FollowupConfig, 'ativo' | 'etapas_horas' | 'janela_inicio' | 'janela_fim'>

export async function saveFollowupConfig(input: FollowupConfigInput): Promise<void> {
  const payload: FollowupConfigInput = {
    ativo: input.ativo,
    etapas_horas: input.etapas_horas,
    janela_inicio: input.janela_inicio,
    janela_fim: input.janela_fim,
  }
  const { error } = await supabase.from('pharmazil_followup_config').update(payload).eq('id', 1)
  if (error) throw new Error(error.message)
}
