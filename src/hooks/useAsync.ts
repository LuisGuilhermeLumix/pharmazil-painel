import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Refaz a consulta mostrando loading. */
  reload: () => Promise<void>
  /** Refaz a consulta em silêncio (sem loading), para polling. */
  refresh: () => Promise<void>
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

  const run = useCallback(async (silent: boolean) => {
    const id = ++seq.current
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const result = await fnRef.current()
      if (id === seq.current) {
        setDataState(result)
        if (silent) setError(null)
      }
    } catch (e) {
      if (id === seq.current) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (id === seq.current && !silent) setLoading(false)
    }
  }, [])

  const reload = useCallback(() => run(false), [run])
  const refresh = useCallback(() => run(true), [run])

  useEffect(() => {
    void run(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setDataState((prev) => updater(prev))
  }, [])

  return { data, loading, error, reload, refresh, setData }
}

/** Chama `fn` a cada `ms` enquanto o componente estiver montado e a aba visível. */
export function usePolling(fn: () => void, ms: number, enabled = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fnRef.current()
    }, ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}
