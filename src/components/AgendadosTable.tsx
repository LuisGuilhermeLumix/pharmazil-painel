import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TD, TH, TR } from '@/components/FollowupTable'
import { cancelarEnvio } from '@/hooks/useEnvios'
import { dayKeyChartLabel, formatAgendado, formatTime, isTodaySP, isoToDayKey, type DayKey } from '@/lib/dates'
import { getAccentColor } from '@/lib/format'
import type { Envio, Instancia } from '@/types/db'

const HEADERS = ['Quando', 'Chat', 'Grupo', 'Conteúdo', '']

interface AgendadosTableProps {
  rows: Envio[]
  loading?: boolean
  error?: string | null
  instancias: Instancia[]
  /** filtro vindo do calendário (chave de dia em SP) */
  filterDay: DayKey | null
  onClearFilter: () => void
  /** chamado após cancelar (ou descobrir que já foi enviado) */
  onChanged: () => void
}

export function AgendadosTable({ rows, loading, error, instancias, filterDay, onClearFilter, onChanged }: AgendadosTableProps) {
  const [cancelando, setCancelando] = useState<Envio | null>(null)
  const [busy, setBusy] = useState(false)
  const nomePorInstancia = new Map(instancias.map((i) => [i.instancia, i.nome]))

  const visiveis = filterDay ? rows.filter((e) => e.agendado_para && isoToDayKey(e.agendado_para) === filterDay) : rows

  async function confirmCancel() {
    if (!cancelando) return
    setBusy(true)
    try {
      const ok = await cancelarEnvio(cancelando.id)
      if (ok) toast.success('Agendamento cancelado')
      else toast.info('Este disparo já foi enviado')
      setCancelando(null)
      onChanged()
    } catch (e) {
      toast.error('Não foi possível cancelar', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Agendados</h3>
          {filterDay && (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex items-center gap-1 rounded-md border border-[#80d7f8]/40 bg-[#80d7f8]/10 px-2 py-0.5 text-[11px] font-medium text-[#80d7f8] hover:bg-[#80d7f8]/20"
            >
              {dayKeyChartLabel(filterDay)}
              <X size={12} />
            </button>
          )}
        </div>
        {!loading && (
          <span className="text-xs text-gray-500 tabular-nums">
            {visiveis.length} {visiveis.length === 1 ? 'pendente' : 'pendentes'}
          </span>
        )}
      </div>

      <div className={visiveis.length > 30 ? 'max-h-[420px] overflow-y-auto' : 'overflow-x-auto'}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {HEADERS.map((h, i) => (
                <th key={i} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className={TR}>
                  {HEADERS.map((_, j) => (
                    <td key={j} className={TD}>
                      <Skeleton className="h-4 w-full bg-white/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-10 text-center text-sm text-[#ef4444]">
                  {error}
                </td>
              </tr>
            ) : visiveis.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-10 text-center text-sm text-gray-500">
                  {filterDay ? 'Nenhum disparo agendado para este dia' : 'Nenhum disparo agendado'}
                </td>
              </tr>
            ) : (
              visiveis.map((e) => {
                const chat = nomePorInstancia.get(e.instancia) ?? e.instancia
                const hoje = e.agendado_para ? isTodaySP(e.agendado_para) : false
                return (
                  <tr key={e.id} className={TR}>
                    <td className={`${TD} whitespace-nowrap tabular-nums`}>
                      <div className="text-xs text-gray-400">
                        {hoje ? 'Hoje' : e.agendado_para ? dayKeyChartLabel(isoToDayKey(e.agendado_para)) : '—'}
                      </div>
                      <div className="text-sm font-medium text-white">{formatTime(e.agendado_para)}</div>
                    </td>
                    <td className={`${TD} whitespace-nowrap text-gray-300`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getAccentColor(chat) }} />
                        {chat}
                      </span>
                    </td>
                    <td className={`${TD} max-w-[140px] truncate font-medium text-white`}>{e.grupo_nome ?? e.grupo_jid}</td>
                    <td className={`${TD} max-w-[180px]`}>
                      <div className="flex items-center gap-2">
                        {e.imagem_url ? (
                          <img src={e.imagem_url} alt="" className="size-8 shrink-0 rounded-lg border border-white/10 object-cover" loading="lazy" />
                        ) : (
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-gray-600">
                            <ImageIcon size={14} />
                          </span>
                        )}
                        {e.texto ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="min-w-0 cursor-default truncate text-xs text-gray-400">{e.texto}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                              {e.texto}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-gray-600">Somente imagem</span>
                        )}
                      </div>
                    </td>
                    <td className={`${TD} w-8 text-right`}>
                      <button
                        type="button"
                        onClick={() => setCancelando(e)}
                        aria-label="Cancelar agendamento"
                        title="Cancelar agendamento"
                        className="rounded-md p-1 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!cancelando} onOpenChange={(o) => !busy && !o && setCancelando(null)}>
        <DialogContent className="rounded-2xl border-white/10 bg-[#111113] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar agendamento</DialogTitle>
            <DialogDescription>
              Cancelar o disparo para <span className="font-semibold text-white">{cancelando?.grupo_nome ?? cancelando?.grupo_jid}</span>{' '}
              marcado para <span className="font-semibold text-white">{formatAgendado(cancelando?.agendado_para)}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="rounded-b-2xl">
            <Button variant="ghost" onClick={() => setCancelando(null)} disabled={busy} className="text-gray-400 hover:text-white">
              Voltar
            </Button>
            <Button onClick={() => void confirmCancel()} disabled={busy} className="rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626]">
              {busy ? 'Cancelando…' : 'Cancelar disparo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
