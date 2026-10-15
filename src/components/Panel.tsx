import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  children: ReactNode
  className?: string
  /** cor hex de acento: aplica brilho radial sutil no canto superior direito */
  accent?: string
  style?: CSSProperties
}

/** Superfície padrão dos CRMs Lumix. Todo card do painel usa este componente. */
export function Panel({ children, className, accent, style }: PanelProps) {
  const glow: CSSProperties | undefined = accent
    ? { background: `radial-gradient(ellipse at top right, ${accent}14 0%, transparent 60%), #111113` }
    : undefined
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-[#111113] p-5 transition-colors hover:border-white/[0.14]',
        className,
      )}
      style={{ ...glow, ...style }}
    >
      {children}
    </div>
  )
}
