import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)

  return (
    <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-xs text-gray-400">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-gray-400 hover:bg-white/5 hover:text-white"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-2">
          {page + 1} / {pages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-gray-400 hover:bg-white/5 hover:text-white"
          disabled={page >= pages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
