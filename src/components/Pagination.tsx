import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

const PILL =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.03]'

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

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
