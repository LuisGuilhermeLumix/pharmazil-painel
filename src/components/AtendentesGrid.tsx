import { useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { isConectada, updateFollowupAtivo } from '@/hooks/useInstancias'
import { formatInt, formatPhone } from '@/lib/format'
import type { FollowupMetricasView, Instancia } from '@/types/db'

interface AtendentesGridProps {
  instancias: Instancia[]
  view: FollowupMetricasView[]
  loading?: boolean
  onChange: (id: number, ativo: boolean) => void
}

export function AtendentesGrid({ instancias, view, loading, onChange }: AtendentesGridProps) {
  const [pending, setPending] = useState<Set<number>>(new Set())
  const viewById = new Map(view.map((v) => [v.instancia_id, v]))

  async function toggle(inst: Instancia, ativo: boolean) {
    const prev = inst.followup_ativo
    onChange(inst.id, ativo)
    setPending((s) => new Set(s).add(inst.id))
    try {
      await updateFollowupAtivo(inst.id, ativo)
      toast.success(`Follow-up ${ativo ? 'ativado' : 'desativado'} para ${inst.nome}`)
    } catch (e) {
      onChange(inst.id, prev)
      toast.error(`Não foi possível atualizar ${inst.nome}`, {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setPending((s) => {
        const n = new Set(s)
        n.delete(inst.id)
        return n
      })
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Atendentes</h3>
        <span className="text-xs text-gray-500">Ative ou pause o follow-up automático por chat</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : instancias.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-gray-500">
          Nenhum atendente cadastrado
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {instancias.map((inst) => {
            const conectada = isConectada(inst)
            const v = viewById.get(inst.id)
            return (
              <div
                key={inst.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{inst.nome}</div>
                  <div className="mt-0.5 text-xs text-gray-400">{formatPhone(inst.numero)}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: conectada ? '#22c55e' : '#ef4444' }}
                    />
                    <span className={conectada ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                      {conectada ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Switch
                    checked={inst.followup_ativo}
                    disabled={pending.has(inst.id)}
                    onCheckedChange={(c) => void toggle(inst, c)}
                    aria-label={`Follow-up de ${inst.nome}`}
                    className="data-[state=checked]:bg-[#22c55e]"
                  />
                  <span className="text-[11px] whitespace-nowrap text-gray-500">
                    {formatInt(v?.leads_em_andamento)} em andamento · {formatInt(v?.leads_recuperados)} recuperados
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
