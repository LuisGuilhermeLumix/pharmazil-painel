import { useEffect, useState } from 'react'
import { CalendarClock, ImageIcon } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EnvioStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { TD, TH, TR } from '@/components/FollowupTable'
import { COL_WIDTHS } from '@/components/AgendadosTable'
import { ENVIADOS_PAGE } from '@/hooks/useEnvios'
import { formatAgendado, formatDateTime, formatShortDateTime } from '@/lib/dates'
import { getAccentColor, shortName } from '@/lib/format'
import type { Envio, Instancia } from '@/types/db'

const HEADERS = ['Data', 'Chat', 'Grupo', 'Conteúdo', 'Status']

interface EnviadosTableProps {
  rows: Envio[]
  loading?: boolean
  error?: string | null
  instancias: Instancia[]
}

export function EnviadosTable({ rows, loading, error, instancias }: EnviadosTableProps) {
  const [page, setPage] = useState(0)
  const [imagem, setImagem] = useState<Envio | null>(null)
  const nomePorInstancia = new Map(instancias.map((i) => [i.instancia, i.nome]))

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(rows.length / ENVIADOS_PAGE))
    if (page > pages - 1) setPage(pages - 1)
  }, [rows.length, page])

  const pageRows = rows.slice(page * ENVIADOS_PAGE, (page + 1) * ENVIADOS_PAGE)

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-white">Enviados</h3>
        {!loading && <span className="text-xs text-gray-500 tabular-nums">{rows.length} no total</span>}
      </div>

      <table className="w-full table-fixed border-collapse">
        <colgroup>
          {COL_WIDTHS.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={TR}>
                {HEADERS.map((h) => (
                  <td key={h} className={TD}>
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
          ) : pageRows.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="px-3 py-10 text-center text-sm text-gray-500">
                Nenhum disparo realizado ainda
              </td>
            </tr>
          ) : (
            pageRows.map((e) => {
              const chatFull = nomePorInstancia.get(e.instancia) ?? e.instancia
              const chat = shortName(chatFull)
              const grupoNome = e.grupo_nome ?? e.grupo_jid
              const data = e.enviado_em ?? e.criado_em
              return (
                <tr key={e.id} className={TR}>
                  <td className={`${TD} whitespace-nowrap text-gray-300 tabular-nums`} title={formatDateTime(data)}>
                    <span className="flex min-w-0 items-center gap-1">
                      <span className="truncate">{formatShortDateTime(data)}</span>
                      {e.agendado_para && (
                        <CalendarClock size={12} className="shrink-0 text-gray-500" aria-label={`Agendado para ${formatAgendado(e.agendado_para)}`} />
                      )}
                    </span>
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
                        <button
                          type="button"
                          onClick={() => setImagem(e)}
                          className="shrink-0 overflow-hidden rounded-md border border-white/10 transition-opacity hover:opacity-80"
                          aria-label="Ver imagem"
                        >
                          <img src={e.imagem_url} alt="" className="size-7 object-cover" loading="lazy" />
                        </button>
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
                  <td className={TD}>
                    <EnvioStatusBadge status={e.status} erro={e.erro} />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {!loading && rows.length > 0 && (
        <Pagination page={page} pageSize={ENVIADOS_PAGE} total={rows.length} onChange={setPage} />
      )}

      <Dialog open={!!imagem} onOpenChange={(o) => !o && setImagem(null)}>
        <DialogContent className="rounded-2xl border-white/10 bg-[#111113] p-2 sm:max-w-2xl">
          <DialogTitle className="sr-only">Imagem do disparo</DialogTitle>
          {imagem?.imagem_url && (
            <img src={imagem.imagem_url} alt={imagem.grupo_nome ?? ''} className="max-h-[80vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
