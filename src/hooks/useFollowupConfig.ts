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
  return (data as FollowupConfig | null) ?? null
}

export function useFollowupConfig() {
  return useAsync<FollowupConfig | null>(fetchFollowupConfig, [])
}

export type FollowupConfigInput = Pick<
  FollowupConfig,
  'ativo' | 'max_etapas' | 'etapa1_horas' | 'etapa2_horas' | 'etapa3_horas' | 'janela_inicio' | 'janela_fim'
>

export async function saveFollowupConfig(input: FollowupConfigInput): Promise<void> {
  const { error } = await supabase.from('pharmazil_followup_config').update(input).eq('id', 1)
  if (error) throw new Error(error.message)
}
