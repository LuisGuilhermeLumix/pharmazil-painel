import { supabase } from '@/lib/supabase'
import type { Grupo } from '@/types/db'
import { useAsync } from './useAsync'

/** Todos os grupos de uma instância (inclusive ocultos), ordenados por nome. */
export async function fetchGrupos(instancia: string): Promise<Grupo[]> {
  const { data, error } = await supabase
    .from('pharmazil_grupos')
    .select('*')
    .eq('instancia', instancia)
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Grupo[]
}

export function useGrupos(instancia: string | null) {
  return useAsync<Grupo[]>(
    async () => (instancia ? fetchGrupos(instancia) : []),
    [instancia],
  )
}

export async function updateGrupoOculto(id: number, oculto: boolean): Promise<void> {
  const { error } = await supabase.from('pharmazil_grupos').update({ oculto }).eq('id', id)
  if (error) throw new Error(error.message)
}
