import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Grupo } from '@/types/db'

interface GrupoMultiSelectProps {
  grupos: Grupo[]
  /** jids selecionados */
  value: string[]
  onChange: (jids: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function GrupoMultiSelect({ grupos, value, onChange, disabled, placeholder = 'Selecione os grupos' }: GrupoMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')

  const porJid = useMemo(() => new Map(grupos.map((g) => [g.jid, g])), [grupos])
  const selecionados = value.map((jid) => porJid.get(jid)).filter((g): g is Grupo => !!g)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? grupos.filter((g) => (g.nome ?? g.jid).toLowerCase().includes(q)) : grupos
  }, [grupos, busca])

  function toggle(jid: string) {
    onChange(value.includes(jid) ? value.filter((v) => v !== jid) : [...value, jid])
  }

  const label =
    selecionados.length === 0
      ? placeholder
      : selecionados.length === 1
        ? (selecionados[0].nome ?? selecionados[0].jid)
        : `${selecionados.length} grupos selecionados`

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm transition-colors',
              'hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50',
              selecionados.length ? 'text-white' : 'text-gray-500',
            )}
          >
            <span className="truncate">{label}</span>
            <ChevronDown size={16} className="shrink-0 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[var(--radix-popover-trigger-width)] rounded-xl border-white/10 bg-[#111113] p-0 shadow-xl"
        >
          <div className="border-b border-white/[0.06] p-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar grupo"
                autoFocus
                className="h-8 rounded-lg border-white/10 bg-white/[0.03] pl-8 text-xs text-white placeholder:text-gray-500"
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
              <button
                type="button"
                onClick={() => onChange(Array.from(new Set([...value, ...filtrados.map((g) => g.jid)])))}
                className="text-[#80d7f8] hover:underline"
              >
                Selecionar todos ({filtrados.length})
              </button>
              <button type="button" onClick={() => onChange([])} className="text-gray-400 hover:text-white hover:underline">
                Limpar
              </button>
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {filtrados.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-gray-500">Nenhum grupo encontrado</li>
            ) : (
              filtrados.map((g) => {
                const checked = value.includes(g.jid)
                return (
                  <li key={g.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/[0.04]">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(g.jid)}
                        className="border-white/20 data-[state=checked]:border-[#80d7f8] data-[state=checked]:bg-[#80d7f8] data-[state=checked]:text-[#0a0a0a]"
                      />
                      <span className="min-w-0 flex-1 truncate" title={g.nome ?? g.jid}>
                        {g.nome ?? g.jid}
                      </span>
                      {g.participantes != null && (
                        <span className="shrink-0 text-[11px] text-gray-500 tabular-nums">{g.participantes}</span>
                      )}
                    </label>
                  </li>
                )
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selecionados.map((g) => (
            <span
              key={g.jid}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-200"
            >
              <span className="truncate" title={g.nome ?? g.jid}>
                {g.nome ?? g.jid}
              </span>
              <button
                type="button"
                onClick={() => toggle(g.jid)}
                aria-label={`Remover ${g.nome ?? g.jid}`}
                className="shrink-0 rounded text-gray-500 hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
