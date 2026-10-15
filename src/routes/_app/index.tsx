import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AtendentesGrid } from '@/components/AtendentesGrid'
import { ConfigDialog } from '@/components/ConfigDialog'
import { FollowupChart } from '@/components/FollowupChart'
import { FollowupTable } from '@/components/FollowupTable'
import { MetricCard } from '@/components/MetricCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { PeriodFilter } from '@/components/layout/PeriodFilter'
import { useFollowupMetrics } from '@/hooks/useFollowupMetrics'
import { useInstancias } from '@/hooks/useInstancias'
import type { Period } from '@/lib/dates'
import { formatInt, formatPct } from '@/lib/format'

export const Route = createFileRoute('/_app/')({
  component: FollowupPage,
})

function FollowupPage() {
  const [period, setPeriod] = useState<Period>({ preset: 'mes' })
  const { metrics, loading, error } = useFollowupMetrics(period)
  const instancias = useInstancias()

  const m = metrics
  const customIncomplete = period.preset === 'custom' && (!period.from || !period.to)

  return (
    <>
      <PageHeader title="Follow-up" subtitle="Recuperação automática de leads que pararam de responder">
        <PeriodFilter value={period} onChange={setPeriod} />
        <ConfigDialog />
      </PageHeader>

      {error && (
        <div className="mb-6 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]">
          Erro ao carregar os dados: {error}
        </div>
      )}
      {customIncomplete && (
        <div className="mb-6 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
          Informe as datas de início e fim do período customizado. Enquanto isso, os dados abaixo mostram todo o
          histórico.
        </div>
      )}

      {/* Linha 1 — métricas gerais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Leads em follow-up"
          value={formatInt(m?.leadsEmFollowup)}
          subtitle="conversas distintas no período"
          breakdown={m?.porEtapa ?? placeholderBreakdown(3)}
          loading={loading}
        />
        <MetricCard
          label="Follow-ups enviados"
          value={formatInt(m?.enviados)}
          color="#e65ff5"
          subtitle="mensagens automáticas"
          breakdown={m?.enviadosPorAtendente ?? placeholderBreakdown(2)}
          loading={loading}
        />
        <MetricCard
          label="Leads recuperados"
          value={formatInt(m?.recuperados)}
          color="#22c55e"
          subtitle="voltaram a responder"
          breakdown={m?.recuperadosPorEtapa ?? placeholderBreakdown(3)}
          loading={loading}
        />
        <MetricCard
          label="Taxa de recuperação"
          value={formatPct(m?.taxa)}
          color="#80d7f8"
          subtitle="recuperados ÷ leads em follow-up"
          breakdown={m?.taxaPorAtendente ?? placeholderBreakdown(2)}
          loading={loading}
        />
      </div>

      {/* Linha 2 — atendentes */}
      <div className="mt-6">
        <AtendentesGrid
          instancias={instancias.data ?? []}
          view={m?.view ?? []}
          loading={instancias.loading}
          onChange={(id, ativo) =>
            instancias.setData((prev) => (prev ? prev.map((i) => (i.id === id ? { ...i, followup_ativo: ativo } : i)) : prev))
          }
        />
      </div>

      {/* Gráfico */}
      <div className="mt-6">
        <FollowupChart data={m?.chart ?? []} loading={loading} />
      </div>

      {/* Tabela */}
      <div className="mt-6">
        <FollowupTable rows={m?.rows ?? []} loading={loading} />
      </div>
    </>
  )
}

function placeholderBreakdown(n: number) {
  return Array.from({ length: n }, (_, i) => ({ label: `#${i}`, value: 0, color: '#6b7280' }))
}
