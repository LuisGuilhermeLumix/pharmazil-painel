import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Percent, Send, TrendingUp, Users } from 'lucide-react'
import { AtendentesGrid } from '@/components/AtendentesGrid'
import { ConfigDialog } from '@/components/ConfigDialog'
import { FollowupChart } from '@/components/FollowupChart'
import { FollowupTable } from '@/components/FollowupTable'
import { MetricCard } from '@/components/MetricCard'
import { FOLLOWUP_CONFIG_SAVED } from '@/components/layout/MobileNav'
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
  const [refreshKey, setRefreshKey] = useState(0)
  const { metrics, loading, error } = useFollowupMetrics(period, refreshKey)
  const instancias = useInstancias()

  // no mobile a engrenagem fica no header fixo; ele avisa por evento quando salva
  useEffect(() => {
    const onSaved = () => setRefreshKey((k) => k + 1)
    window.addEventListener(FOLLOWUP_CONFIG_SAVED, onSaved)
    return () => window.removeEventListener(FOLLOWUP_CONFIG_SAVED, onSaved)
  }, [])

  const m = metrics
  const customIncomplete = period.preset === 'custom' && (!period.from || !period.to)

  return (
    <>
      <PageHeader title="Follow-up">
        {/* desktop: filtro + engrenagem à direita do título (como antes) */}
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <PeriodFilter value={period} onChange={setPeriod} />
          <ConfigDialog onSaved={() => setRefreshKey((k) => k + 1)} />
        </div>
      </PageHeader>
      {/* mobile: fileira de pílulas com scroll próprio abaixo do título; engrenagem fica no header fixo */}
      <div className="mb-4 min-w-0 lg:hidden">
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]">
          Erro ao carregar os dados: {error}
        </div>
      )}
      {customIncomplete && (
        <div className="mb-4 rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
          Informe as datas de início e fim do período customizado. Enquanto isso, os dados abaixo mostram todo o
          histórico.
        </div>
      )}

      {/* Linha 1 — métricas gerais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Leads em follow-up"
          icon={Users}
          value={formatInt(m?.leadsEmFollowup)}
          subtitle="conversas distintas no período"
          breakdown={m?.porEtapa ?? placeholderBreakdown(3)}
          loading={loading}
        />
        <MetricCard
          label="Follow-ups enviados"
          icon={Send}
          value={formatInt(m?.enviados)}
          accent="#80d7f8"
          subtitle="mensagens automáticas"
          breakdown={m?.enviadosPorAtendente ?? placeholderBreakdown(2)}
          loading={loading}
        />
        <MetricCard
          label="Leads recuperados"
          icon={TrendingUp}
          value={formatInt(m?.recuperados)}
          accent="#22c55e"
          subtitle="voltaram a responder"
          breakdown={m?.recuperadosPorEtapa ?? placeholderBreakdown(3)}
          loading={loading}
        />
        <MetricCard
          label="Taxa de recuperação"
          icon={Percent}
          value={formatPct(m?.taxa)}
          accent="#e65ff5"
          subtitle="recuperados ÷ leads em follow-up"
          breakdown={m?.taxaPorAtendente ?? placeholderBreakdown(2)}
          loading={loading}
        />
      </div>

      {/* Linha 2 — atendentes */}
      <div className="mt-4">
        <AtendentesGrid
          instancias={instancias.data ?? []}
          view={m?.view ?? []}
          loading={instancias.loading}
          onChange={(id, ativo) =>
            instancias.setData((prev) =>
              prev ? prev.map((i) => (i.id === id ? { ...i, followup_ativo: ativo } : i)) : prev,
            )
          }
        />
      </div>

      {/* Gráfico */}
      <div className="mt-4">
        <FollowupChart data={m?.chart ?? []} loading={loading} />
      </div>

      {/* Tabela */}
      <div className="mt-4">
        <FollowupTable rows={m?.rows ?? []} loading={loading} />
      </div>
    </>
  )
}

function placeholderBreakdown(n: number) {
  return Array.from({ length: n }, (_, i) => ({ label: `#${i}`, value: 0, color: '#6b7280' }))
}
