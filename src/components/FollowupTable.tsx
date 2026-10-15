import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FollowupStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import type { FollowupRow } from '@/hooks/useFollowupMetrics'
import { formatDateTime } from '@/lib/dates'
import { formatPhone } from '@/lib/format'

const PAGE_SIZE = 25

interface FollowupTableProps {
  rows: FollowupRow[]
  loading?: boolean
}

export function FollowupTable({ rows, loading }: FollowupTableProps) {
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

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <h3 className="text-sm font-semibold text-white">Últimos follow-ups</h3>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="h-8 border-white/10 bg-white/[0.02] pl-8 text-xs text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            {['Data', 'Lead', 'Telefone', 'Atendente', 'Etapa', 'Status', 'Mensagem'].map((h) => (
              <TableHead key={h} className="h-9 px-6 text-xs font-medium uppercase tracking-wide text-gray-400">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-white/5 hover:bg-transparent">
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j} className="px-6 py-3">
                    <Skeleton className="h-4 w-full bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : pageRows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                {search ? 'Nenhum resultado para a busca' : 'Nenhum follow-up no período'}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((r) => (
              <TableRow key={r.id} className="border-white/5 hover:bg-white/[0.03]">
                <TableCell className="px-6 py-3 text-sm whitespace-nowrap text-gray-300">
                  {formatDateTime(r.enviado_em)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-6 py-3 text-sm font-medium text-white">
                  {r.lead}
                </TableCell>
                <TableCell className="px-6 py-3 text-sm whitespace-nowrap text-gray-300">
                  {formatPhone(r.telefone)}
                </TableCell>
                <TableCell className="px-6 py-3 text-sm whitespace-nowrap text-gray-300">{r.atendente}</TableCell>
                <TableCell className="px-6 py-3 text-sm text-gray-300">
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-200">
                    Etapa {r.etapa}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-3">
                  <FollowupStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="max-w-[320px] px-6 py-3 text-sm text-gray-400">
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && filtered.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
      )}
    </div>
  )
}
