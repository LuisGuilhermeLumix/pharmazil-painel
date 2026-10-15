import { useState } from 'react'
import { toast } from 'sonner'
import { Panel } from '@/components/Panel'
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
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white">Atendentes</h3>
        <span className="text-xs text-gray-500">Ative ou pause o follow-up automático por chat</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : instancias.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Nenhum atendente cadastrado</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {instancias.map((inst) => {
            const conectada = isConectada(inst)
            const v = viewById.get(inst.id)
            return (
              <div
                key={inst.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{inst.nome}</div>
                  <div className="text-xs text-gray-500 tabular-nums">{formatPhone(inst.numero)}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: conectada ? '#22c55e' : '#ef4444' }}
                    />
                    <span style={{ color: conectada ? '#22c55e' : '#ef4444' }}>
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
                    className="data-[state=checked]:bg-[#80d7f8]!"
                  />
                  <span className="text-right text-[11px] whitespace-nowrap text-gray-500 tabular-nums">
                    {formatInt(v?.leads_em_andamento)} em andamento · {formatInt(v?.leads_recuperados)} recuperados
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
