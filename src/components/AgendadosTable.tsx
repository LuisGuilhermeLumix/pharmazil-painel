import { useState } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { EnvioCard } from '@/components/EnvioCard'
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
import { TD, TH, TR } from '@/components/FollowupTable'
import { cancelarEnvio } from '@/hooks/useEnvios'
import { useIsMobile } from '@/hooks/useIsMobile'
import { dayKeyChartLabel, formatAgendado, formatAgendadoShort, isoToDayKey, type DayKey } from '@/lib/dates'
import { getAccentColor, shortName } from '@/lib/format'
import type { Envio, Instancia } from '@/types/db'

const HEADERS = ['Quando', 'Chat', 'Grupo', 'Conteúdo', '']
/** Quando 16% · Chat 18% · Grupo 18% · Conteúdo restante · ação 12% */
export const COL_WIDTHS = ['16%', '18%', '18%', 'auto', '12%']

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
  const isMobile = useIsMobile()
  const [cancelando, setCancelando] = useState<Envio | null>(null)
  const [busy, setBusy] = useState(false)
  const nomePorInstancia = new Map(instancias.map((i) => [i.instancia, i.nome]))

  const visiveis = filterDay ? rows.filter((e) => e.agendado_para && isoToDayKey(e.agendado_para) === filterDay) : rows
  const emptyText = filterDay ? 'Nenhum disparo agendado para este dia' : 'Nenhum disparo agendado'

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
    <Panel className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Agendados</h3>
          {filterDay && (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[#80d7f8]/40 bg-[#80d7f8]/10 px-2 py-0.5 text-[11px] font-medium text-[#80d7f8] hover:bg-[#80d7f8]/20 lg:min-h-0"
            >
              {dayKeyChartLabel(filterDay)}
              <X size={12} />
            </button>
          )}
        </div>
        {!loading && (
          <span className="shrink-0 text-xs text-gray-500 tabular-nums">
            {visiveis.length} {visiveis.length === 1 ? 'pendente' : 'pendentes'}
          </span>
        )}
      </div>

      {isMobile ? (
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <p className="py-8 text-center text-sm text-[#ef4444]">{error}</p>
          ) : visiveis.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{emptyText}</p>
          ) : (
            <ul className="space-y-2">
              {visiveis.map((e) => (
                <EnvioCard
                  key={e.id}
                  envio={e}
                  chatNome={nomePorInstancia.get(e.instancia) ?? e.instancia}
                  modo="agendado"
                  acao={
                    <button
                      type="button"
                      onClick={() => setCancelando(e)}
                      aria-label="Cancelar agendamento"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-colors hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              {COL_WIDTHS.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 bg-[#111113]">
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
                    {emptyText}
                  </td>
                </tr>
              ) : (
                visiveis.map((e) => {
                  const chatFull = nomePorInstancia.get(e.instancia) ?? e.instancia
                  const chat = shortName(chatFull)
                  const grupoNome = e.grupo_nome ?? e.grupo_jid
                  return (
                    <tr key={e.id} className={TR}>
                      <td className={`${TD} whitespace-nowrap text-white tabular-nums`} title={formatAgendado(e.agendado_para)}>
                        <span className="block truncate">{formatAgendadoShort(e.agendado_para)}</span>
                      </td>
                      <td className={`${TD} text-gray-300`} title={chatFull}>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getAccentColor(chatFull) }} />
                          <span className="truncate">{chat}</span>
                        </span>
                      </td>
                      <td className={`${TD} font-medium text-white`} title={grupoNome}>
                        <span className="block truncate">{grupoNome}</span>
                      </td>
                      <td className={TD}>
                        <div className="flex min-w-0 items-center gap-2">
                          {e.imagem_url ? (
                            <img src={e.imagem_url} alt="" className="size-7 shrink-0 rounded-md border border-white/10 object-cover" loading="lazy" />
                          ) : (
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/5 bg-white/[0.02] text-gray-600">
                              <ImageIcon size={12} />
                            </span>
                          )}
                          {e.texto ? (
                            <span className="min-w-0 truncate text-xs text-gray-400" title={e.texto}>
                              {e.texto}
                            </span>
                          ) : (
                            <span className="truncate text-xs text-gray-600">Somente imagem</span>
                          )}
                        </div>
                      </td>
                      <td className={`${TD} text-right`}>
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
      )}

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
            <Button variant="ghost" onClick={() => setCancelando(null)} disabled={busy} className="h-10 text-gray-400 hover:text-white lg:h-8">
              Voltar
            </Button>
            <Button onClick={() => void confirmCancel()} disabled={busy} className="h-10 rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] lg:h-8">
              {busy ? 'Cancelando…' : 'Cancelar disparo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
