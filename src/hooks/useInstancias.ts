import { supabase } from '@/lib/supabase'
import type { Instancia } from '@/types/db'
import { useAsync } from './useAsync'

export async function fetchInstancias(): Promise<Instancia[]> {
  const { data, error } = await supabase
    .from('pharmazil_instancias')
    .select('*')
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Instancia[]
}

export function useInstancias() {
  return useAsync<Instancia[]>(fetchInstancias, [])
}

export async function updateFollowupAtivo(id: number, ativo: boolean): Promise<void> {
  const { error } = await supabase
    .from('pharmazil_instancias')
    .update({ followup_ativo: ativo })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export function isConectada(i: Pick<Instancia, 'status_conexao'>): boolean {
  return i.status_conexao === 'open'
}
