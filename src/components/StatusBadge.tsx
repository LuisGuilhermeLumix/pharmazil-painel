import type { EnvioStatus, FollowupStatus } from '@/types/db'
import { cn } from '@/lib/utils'

type BadgeTone = 'green' | 'blue' | 'red' | 'gray' | 'yellow' | 'purple'

const TONES: Record<BadgeTone, string> = {
  green: 'bg-[#22c55e]/15 text-[#22c55e]',
  blue: 'bg-[#80d7f8]/15 text-[#80d7f8]',
  red: 'bg-[#ef4444]/15 text-[#ef4444]',
  gray: 'bg-[#6b7280]/20 text-gray-300',
  yellow: 'bg-[#f59e0b]/15 text-[#f59e0b]',
  purple: 'bg-[#e65ff5]/15 text-[#e65ff5]',
}

export function ToneBadge({ tone, children, className, title }: { tone: BadgeTone; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
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
  return (
    <ToneBadge tone={s.tone} title={status === 'erro' && erro ? erro : undefined} className={status === 'erro' && erro ? 'cursor-help' : undefined}>
      {s.label}
    </ToneBadge>
  )
}
