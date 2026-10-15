import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { updateGrupoOculto } from '@/hooks/useGrupos'
import { formatInt } from '@/lib/format'
import type { Grupo } from '@/types/db'

interface GerenciarGruposDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanciaNome: string
  grupos: Grupo[]
  loading?: boolean
  onChange: (id: number, oculto: boolean) => void
}

export function GerenciarGruposDialog({
  open,
  onOpenChange,
  instanciaNome,
  grupos,
  loading,
  onChange,
}: GerenciarGruposDialogProps) {
  const [pending, setPending] = useState<Set<number>>(new Set())

  async function toggle(g: Grupo, visivel: boolean) {
    const oculto = !visivel
    const prev = g.oculto
    onChange(g.id, oculto)
    setPending((s) => new Set(s).add(g.id))
    try {
      await updateGrupoOculto(g.id, oculto)
    } catch (e) {
      onChange(g.id, prev)
      toast.error(`Não foi possível atualizar ${g.nome ?? g.jid}`, {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setPending((s) => {
        const n = new Set(s)
        n.delete(g.id)
        return n
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#111113] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar grupos</DialogTitle>
          <DialogDescription>
            Grupos de <span className="text-white">{instanciaNome}</span>. Grupos ocultos não aparecem na lista de
            disparo.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-white/5" />
              ))}
            </div>
          ) : grupos.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Nenhum grupo sincronizado para este chat</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {grupos.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{g.nome ?? g.jid}</div>
                    <div className="text-xs text-gray-500">
                      {formatInt(g.participantes)} participantes
                      {!g.ativo && <span className="ml-2 text-[#f59e0b]">· inativo</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                    Visível
                    <Switch
                      checked={!g.oculto}
                      disabled={pending.has(g.id)}
                      onCheckedChange={(c) => void toggle(g, c)}
                      aria-label={`Visibilidade de ${g.nome ?? g.jid}`}
                      className="data-[state=checked]:bg-[#22c55e]"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
