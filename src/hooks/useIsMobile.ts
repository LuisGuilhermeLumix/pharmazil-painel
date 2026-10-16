import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1023px)'

/**
 * `true` abaixo do breakpoint `lg` (1024px).
 * Use só para decidir entre tabela/cards e popover/dialog; para esconder
 * conteúdo, prefira classes responsivas do Tailwind.
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches)
    setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}
