import type { ReactNode } from 'react'
import type { EnvioStatus, FollowupStatus } from '@/types/db'
import { cn } from '@/lib/utils'

const COLORS = {
  green: '#22c55e',
  blue: '#80d7f8',
  red: '#ef4444',
  gray: '#6b7280',
  yellow: '#f59e0b',
  purple: '#e65ff5',
} as const

type BadgeTone = keyof typeof COLORS

export function ToneBadge({
  tone,
  children,
  className,
  title,
}: {
  tone: BadgeTone
  children: ReactNode
  className?: string
  title?: string
}) {
  const c = COLORS[tone]
  return (
    <span
      title={title}
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}
      style={{ backgroundColor: `${c}26`, color: c }}
    >
      {children}
    </span>
  )
}

const FOLLOWUP: Record<FollowupStatus, { label: string; tone: BadgeTone }> = {
  respondeu: { label: 'Respondeu', tone: 'green' },
  em_andamento: { label: 'Em andamento', tone: 'blue' },
  esgotado: { label: 'Esgotado', tone: 'red' },
  encerrado: { label: 'Encerrado', tone: 'gray' },
  nenhum: { label: 'Nenhum', tone: 'gray' },
}

export function FollowupStatusBadge({ status }: { status: FollowupStatus | null | undefined }) {
  const s = (status && FOLLOWUP[status]) || FOLLOWUP.nenhum
  return <ToneBadge tone={s.tone}>{s.label}</ToneBadge>
}

const ENVIO: Record<EnvioStatus, { label: string; tone: BadgeTone }> = {
  enviado: { label: 'Enviado', tone: 'green' },
  erro: { label: 'Erro', tone: 'red' },
  pendente: { label: 'Pendente', tone: 'yellow' },
}

export function EnvioStatusBadge({ status, erro }: { status: EnvioStatus | string; erro?: string | null }) {
  const s = ENVIO[status as EnvioStatus] ?? { label: status, tone: 'gray' as BadgeTone }
  const hasErro = status === 'erro' && !!erro
  return (
    <ToneBadge tone={s.tone} title={hasErro ? erro : undefined} className={hasErro ? 'cursor-help' : undefined}>
      {s.label}
    </ToneBadge>
  )
}
