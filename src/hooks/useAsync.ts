import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  /** Atualiza o dado em memória sem refazer a consulta (uso otimista). */
  setData: (updater: (prev: T | null) => T | null) => void
}

/**
 * Hook mínimo para consultas assíncronas com reload.
 * `deps` controla quando a consulta é refeita.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const seq = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async () => {
    const id = ++seq.current
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      if (id === seq.current) setDataState(result)
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setDataState((prev) => updater(prev))
  }, [])

  return { data, loading, error, reload: run, setData }
}
