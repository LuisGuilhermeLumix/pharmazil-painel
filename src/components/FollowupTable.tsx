import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FollowupStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import type { FollowupRow } from '@/hooks/useFollowupMetrics'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatDateTime } from '@/lib/dates'
import { formatPhone, getAccentColor, getEtapaColor, shortName } from '@/lib/format'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25
const HEADERS = ['Data', 'Lead', 'Telefone', 'Atendente', 'Etapa', 'Status', 'Mensagem']

export const TH = 'px-3 pb-2 text-left text-[11px] font-medium uppercase tracking-wider text-gray-500'
export const TR = 'border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]'
export const TD = 'px-3 py-3.5 text-sm'

interface FollowupTableProps {
  rows: FollowupRow[]
  loading?: boolean
}

function EtapaBadge({ etapa }: { etapa: number }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${getEtapaColor(etapa)}26`, color: getEtapaColor(etapa) }}
    >
      Etapa {etapa}
    </span>
  )
}

/** Card de um follow-up (versão mobile). */
function FollowupCard({ r }: { r: FollowupRow }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <li className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold text-white" title={r.lead}>
          {r.lead}
        </span>
        <FollowupStatusBadge status={r.status} />
      </div>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-400">
        <span className="tabular-nums">{formatPhone(r.telefone)}</span>
        <span className="text-gray-600">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getAccentColor(r.atendente) }} />
          {shortName(r.atendente)}
        </span>
        <span className="text-gray-600">·</span>
        <EtapaBadge etapa={r.etapa} />
      </div>
      <div className="mt-1 text-xs text-gray-500 tabular-nums">{formatDateTime(r.enviado_em)}</div>
      {r.mensagem && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn('mt-2 block w-full text-left text-xs text-gray-400', !expanded && 'line-clamp-2')}
        >
          {r.mensagem}
        </button>
      )}
    </li>
  )
}

export function FollowupTable({ rows, loading }: FollowupTableProps) {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    if (!q) return rows
    return rows.filter((r) => {
      if (r.lead.toLowerCase().includes(q)) return true
      if (digits && r.telefone && r.telefone.replace(/\D/g, '').includes(digits)) return true
      return false
    })
  }, [rows, search])

  useEffect(() => {
    setPage(0)
  }, [search, rows])

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const emptyText = search ? 'Nenhum resultado para a busca' : 'Nenhum follow-up no período'

  return (
    <Panel className="min-w-0">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h3 className="text-sm font-semibold text-white">Últimos follow-ups</h3>
        <div className="relative w-full lg:w-64">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="h-10 w-full rounded-lg border-white/10 bg-white/[0.03] pl-8 text-white placeholder:text-gray-500 lg:h-8 lg:w-64 lg:text-xs"
          />
        </div>
      </div>

      {isMobile ? (
        loading ? (
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
              </li>
            ))}
          </ul>
        ) : pageRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">{emptyText}</p>
        ) : (
          <ul className="space-y-2">
            {pageRows.map((r) => (
              <FollowupCard key={r.id} r={r} />
            ))}
          </ul>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className={TR}>
                    {HEADERS.map((h) => (
                      <td key={h} className={TD}>
                        <Skeleton className="h-4 w-full bg-white/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} className="px-3 py-10 text-center text-sm text-gray-500">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className={TR}>
                    <td className={`${TD} whitespace-nowrap text-gray-300 tabular-nums`}>{formatDateTime(r.enviado_em)}</td>
                    <td className={`${TD} max-w-[200px] truncate font-medium text-white`}>{r.lead}</td>
                    <td className={`${TD} whitespace-nowrap text-gray-300 tabular-nums`}>{formatPhone(r.telefone)}</td>
                    <td className={`${TD} whitespace-nowrap text-gray-300`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getAccentColor(r.atendente) }} />
                        {r.atendente}
                      </span>
                    </td>
                    <td className={TD}>
                      <EtapaBadge etapa={r.etapa} />
                    </td>
                    <td className={TD}>
                      <FollowupStatusBadge status={r.status} />
                    </td>
                    <td className={`${TD} max-w-[320px] text-gray-400`}>
                      {r.mensagem ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block cursor-default truncate">{r.mensagem}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                            {r.mensagem}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
      )}
    </Panel>
  )
}
