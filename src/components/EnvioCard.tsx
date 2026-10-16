import type { ReactNode } from 'react'
import { CalendarClock, ImageIcon } from 'lucide-react'
import { EnvioStatusBadge } from '@/components/StatusBadge'
import { formatAgendado, formatAgendadoShort, formatShortDateTime } from '@/lib/dates'
import { getAccentColor, shortName } from '@/lib/format'
import type { Envio } from '@/types/db'

interface EnvioCardProps {
  envio: Envio
  /** nome completo do chat (instância) */
  chatNome: string
  /** "agendado": mostra a hora do agendamento; "enviado": data de envio/criação */
  modo: 'agendado' | 'enviado'
  /** conteúdo à direita da linha 1 (botão de cancelar, badge de status…) */
  acao?: ReactNode
  onImageClick?: () => void
}

/** Card de um disparo (versão mobile das listas Agendados / Enviados / dia do calendário). */
export function EnvioCard({ envio: e, chatNome, modo, acao, onImageClick }: EnvioCardProps) {
  const grupoNome = e.grupo_nome ?? e.grupo_jid
  const data = modo === 'agendado' ? formatAgendadoShort(e.agendado_para) : formatShortDateTime(e.enviado_em ?? e.criado_em)

  return (
    <li className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white tabular-nums">
          <span className="truncate">{data}</span>
          {modo === 'enviado' && e.agendado_para && (
            <CalendarClock size={12} className="shrink-0 text-gray-500" aria-label={`Agendado para ${formatAgendado(e.agendado_para)}`} />
          )}
        </span>
        <span className="shrink-0">{acao ?? <EnvioStatusBadge status={e.status} erro={e.erro} />}</span>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-gray-400">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getAccentColor(chatNome) }} />
        <span className="shrink-0">{shortName(chatNome)}</span>
        <span className="text-gray-600">·</span>
        <span className="min-w-0 truncate text-gray-200" title={grupoNome}>
          {grupoNome}
        </span>
      </div>
      <div className="mt-2 flex items-start gap-2.5">
        {e.imagem_url ? (
          <button
            type="button"
            onClick={onImageClick}
            disabled={!onImageClick}
            className="shrink-0 overflow-hidden rounded-lg border border-white/10 disabled:cursor-default"
            aria-label="Ver imagem"
          >
            <img src={e.imagem_url} alt="" className="size-9 object-cover" loading="lazy" />
          </button>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-gray-600">
            <ImageIcon size={14} />
          </span>
        )}
        {e.texto ? (
          <p className="line-clamp-2 min-w-0 text-xs text-gray-400" title={e.texto}>
            {e.texto}
          </p>
        ) : (
          <p className="text-xs text-gray-600">Somente imagem</p>
        )}
      </div>
    </li>
  )
}
