import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

const PILL =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.03]'
const WIDE =
  'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40'

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const isMobile = useIsMobile()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  if (isMobile) {
    return (
      <div className="mt-3 space-y-2 pt-3 text-xs text-gray-500 tabular-nums">
        <div className="flex items-center justify-between">
          <span>
            {from}–{to} de {total}
          </span>
          <span>
            {page + 1} / {pages}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" className={WIDE} disabled={page <= 0} onClick={() => onChange(page - 1)}>
            <ChevronLeft size={14} />
            Anterior
          </button>
          <button type="button" className={WIDE} disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
            Próxima
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center justify-between pt-3 text-xs text-gray-500 tabular-nums">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={PILL} disabled={page <= 0} onClick={() => onChange(page - 1)} aria-label="Página anterior">
          <ChevronLeft size={14} />
        </button>
        <span className="px-1.5">
          {page + 1} / {pages}
        </span>
        <button type="button" className={PILL} disabled={page >= pages - 1} onClick={() => onChange(page + 1)} aria-label="Próxima página">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
