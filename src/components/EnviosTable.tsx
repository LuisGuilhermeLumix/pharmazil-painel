import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EnvioStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { ENVIOS_PAGE, type EnviosPage } from '@/hooks/useEnvios'
import { formatDateTime } from '@/lib/dates'
import type { Envio, Instancia } from '@/types/db'

interface EnviosTableProps {
  page: number
  data: EnviosPage | null
  loading?: boolean
  error?: string | null
  instancias: Instancia[]
  onPageChange: (page: number) => void
}

export function EnviosTable({ page, data, loading, error, instancias, onPageChange }: EnviosTableProps) {
  const [imagem, setImagem] = useState<Envio | null>(null)
  const nomePorInstancia = new Map(instancias.map((i) => [i.instancia, i.nome]))
  const rows = data?.rows ?? []

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <h3 className="text-sm font-semibold text-white">Histórico de disparos</h3>
        {data && <span className="text-xs text-gray-500">{data.total} no total</span>}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            {['Data', 'Chat', 'Grupo', 'Conteúdo', 'Status'].map((h) => (
              <TableHead key={h} className="h-9 px-6 text-xs font-medium uppercase tracking-wide text-gray-400">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-white/5 hover:bg-transparent">
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j} className="px-6 py-3">
                    <Skeleton className="h-4 w-full bg-white/5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="px-6 py-10 text-center text-sm text-[#ef4444]">
                {error}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                Nenhum disparo realizado ainda
              </TableCell>
            </TableRow>
          ) : (
            rows.map((e) => (
              <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.03]">
                <TableCell className="px-6 py-3 text-sm whitespace-nowrap text-gray-300">
                  {formatDateTime(e.criado_em)}
                </TableCell>
                <TableCell className="px-6 py-3 text-sm whitespace-nowrap text-gray-300">
                  {nomePorInstancia.get(e.instancia) ?? e.instancia}
                </TableCell>
                <TableCell className="max-w-[200px] truncate px-6 py-3 text-sm font-medium text-white">
                  {e.grupo_nome ?? e.grupo_jid}
                </TableCell>
                <TableCell className="max-w-[320px] px-6 py-3">
                  <div className="flex items-center gap-3">
                    {e.imagem_url ? (
                      <button
                        type="button"
                        onClick={() => setImagem(e)}
                        className="shrink-0 overflow-hidden rounded-md border border-white/10 transition-opacity hover:opacity-80"
                        aria-label="Ver imagem"
                      >
                        <img src={e.imagem_url} alt="" className="size-10 object-cover" loading="lazy" />
                      </button>
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/5 bg-white/[0.02] text-gray-600">
                        <ImageIcon className="size-4" />
                      </span>
                    )}
                    {e.texto ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="min-w-0 cursor-default truncate text-sm text-gray-400">{e.texto}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                          {e.texto}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-sm text-gray-600">Somente imagem</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-3">
                  <EnvioStatusBadge status={e.status} erro={e.erro} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={ENVIOS_PAGE} total={data.total} onChange={onPageChange} />
      )}

      <Dialog open={!!imagem} onOpenChange={(o) => !o && setImagem(null)}>
        <DialogContent className="border-white/10 bg-[#111113] p-2 sm:max-w-2xl">
          <DialogTitle className="sr-only">Imagem do disparo</DialogTitle>
          {imagem?.imagem_url && (
            <img src={imagem.imagem_url} alt={imagem.grupo_nome ?? ''} className="max-h-[80vh] w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
