import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/useIsMobile'
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

const CHECKBOX = 'border-white/20 data-[state=checked]:border-[#80d7f8] data-[state=checked]:bg-[#80d7f8] data-[state=checked]:text-[#0a0a0a]'

/** Busca + "Selecionar todos / Limpar" + lista com checkboxes. Compartilhado pelo popover e pelo dialog. */
function GrupoList({
  grupos,
  value,
  onChange,
  busca,
  setBusca,
  mobile,
}: {
  grupos: Grupo[]
  value: string[]
  onChange: (jids: string[]) => void
  busca: string
  setBusca: (s: string) => void
  mobile: boolean
}) {
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? grupos.filter((g) => (g.nome ?? g.jid).toLowerCase().includes(q)) : grupos
  }, [grupos, busca])

  function toggle(jid: string) {
    onChange(value.includes(jid) ? value.filter((v) => v !== jid) : [...value, jid])
  }

  return (
    <>
      <div className={cn('border-b border-white/[0.06]', mobile ? 'px-4 pb-3' : 'p-2')}>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar grupo"
            autoFocus={!mobile}
            className={cn(
              'rounded-lg border-white/10 bg-white/[0.03] pl-8 text-white placeholder:text-gray-500',
              mobile ? 'h-11' : 'h-8 text-xs',
            )}
          />
        </div>
        <div className={cn('mt-2 flex items-center justify-between px-1', mobile ? 'text-xs' : 'text-[11px]')}>
          <button
            type="button"
            onClick={() => onChange(Array.from(new Set([...value, ...filtrados.map((g) => g.jid)])))}
            className={cn('text-[#80d7f8] hover:underline', mobile && 'min-h-10')}
          >
            Selecionar todos ({filtrados.length})
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className={cn('text-gray-400 hover:text-white hover:underline', mobile && 'min-h-10')}
          >
            Limpar
          </button>
        </div>
      </div>
      <ul className={cn(mobile ? 'flex-1 overflow-y-auto px-2 py-1' : 'max-h-64 overflow-y-auto p-1')}>
        {filtrados.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-gray-500">Nenhum grupo encontrado</li>
        ) : (
          filtrados.map((g) => {
            const checked = value.includes(g.jid)
            return (
              <li key={g.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-2 text-gray-200 hover:bg-white/[0.04]',
                    mobile ? 'h-11 text-base' : 'py-1.5 text-sm',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(g.jid)}
                    className={cn(CHECKBOX, mobile && 'size-5 [&_svg]:size-4')}
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
    </>
  )
}

export function GrupoMultiSelect({ grupos, value, onChange, disabled, placeholder = 'Selecione os grupos' }: GrupoMultiSelectProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  /** no mobile a seleção é provisória até "Confirmar" */
  const [pending, setPending] = useState<string[]>(value)

  useEffect(() => {
    if (open) setPending(value)
  }, [open, value])

  const porJid = useMemo(() => new Map(grupos.map((g) => [g.jid, g])), [grupos])
  const selecionados = value.map((jid) => porJid.get(jid)).filter((g): g is Grupo => !!g)

  const label =
    selecionados.length === 0
      ? placeholder
      : selecionados.length === 1
        ? (selecionados[0].nome ?? selecionados[0].jid)
        : `${selecionados.length} grupos selecionados`

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={isMobile ? () => setOpen(true) : undefined}
      className={cn(
        'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 transition-colors lg:h-9 lg:text-sm',
        'hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50',
        selecionados.length ? 'text-white' : 'text-gray-500',
      )}
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={16} className="shrink-0 text-gray-500" />
    </button>
  )

  return (
    <div className="min-w-0 space-y-2">
      {isMobile ? (
        <>
          {trigger}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              showCloseButton={false}
              className="fixed inset-0 flex h-[100dvh] max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#0a0a0a] p-0"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
                <DialogTitle className="text-base font-semibold">Grupos</DialogTitle>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="pt-3" />
              <div className="flex min-h-0 flex-1 flex-col">
                <GrupoList grupos={grupos} value={pending} onChange={setPending} busca={busca} setBusca={setBusca} mobile />
              </div>
              <div className="shrink-0 border-t border-white/[0.06] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  onClick={() => {
                    onChange(pending)
                    setOpen(false)
                  }}
                  className="h-12 w-full rounded-lg bg-[#80d7f8] text-base font-semibold text-[#0a0a0a] hover:bg-[#9ee1fa]"
                >
                  Confirmar ({pending.length})
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-[var(--radix-popover-trigger-width)] rounded-xl border-white/10 bg-[#111113] p-0 shadow-xl"
          >
            <GrupoList grupos={grupos} value={value} onChange={onChange} busca={busca} setBusca={setBusca} mobile={false} />
          </PopoverContent>
        </Popover>
      )}

      {selecionados.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {selecionados.map((g) => (
            <span
              key={g.jid}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-gray-200"
            >
              <span className="truncate" title={g.nome ?? g.jid}>
                {g.nome ?? g.jid}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== g.jid))}
                aria-label={`Remover ${g.nome ?? g.jid}`}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:text-white"
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
