import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** conteúdo à direita (filtros, ações) */
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle && <span className="hidden text-sm text-gray-500 lg:inline">{subtitle}</span>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
