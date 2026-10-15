import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas no .env')
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Tamanho máximo que o PostgREST devolve por chamada. */
export const PAGE_SIZE = 1000

type RangeResult = PromiseLike<{ data: unknown; error: { message: string } | null }>

/**
 * Busca todas as linhas de uma consulta paginando com `.range()`.
 * `build` deve devolver uma query nova a cada chamada (os builders são mutáveis).
 */
export async function fetchAll<T>(
  build: () => { range: (from: number, to: number) => RangeResult },
): Promise<T[]> {
  const out: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return out
}

/** Divide um array em blocos (para `.in()` com muitos ids). */
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
