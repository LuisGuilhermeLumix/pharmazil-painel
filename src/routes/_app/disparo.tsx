import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AgendadosTable } from '@/components/AgendadosTable'
import { CalendarioDisparos } from '@/components/CalendarioDisparos'
import { DisparoForm } from '@/components/DisparoForm'
import { EnviadosTable } from '@/components/EnviadosTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { useEnviosData } from '@/hooks/useEnvios'
import { useInstancias } from '@/hooks/useInstancias'
import type { DayKey } from '@/lib/dates'

export const Route = createFileRoute('/_app/disparo')({
  component: DisparoPage,
})

function DisparoPage() {
  const instancias = useInstancias()
  const envios = useEnviosData()
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  /** Recarrega enviados, agendados e o calendário após qualquer mudança. */
  function handleChanged() {
    void envios.refresh()
    setRefreshKey((k) => k + 1)
  }

  const lista = instancias.data ?? []
  const carregando = envios.loading && !envios.data

  return (
    <>
      <PageHeader title="Disparo em grupos" subtitle="Envie imagem e texto para os grupos do WhatsApp de cada chat" />

      <div className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row lg:items-start">
        {/* formulário: largura total no celular, fixo à esquerda no desktop */}
        <div className="w-full min-w-0 shrink-0 lg:w-[400px]">
          <DisparoForm instancias={lista} loadingInstancias={instancias.loading} onSent={handleChanged} />
        </div>

        {/* coluna direita flexível: Agendados → Enviados → Calendário */}
        <div className="min-w-0 flex-1 space-y-4">
          <AgendadosTable
            rows={envios.data?.agendados ?? []}
            loading={carregando}
            error={envios.error}
            instancias={lista}
            filterDay={selectedDay}
            onClearFilter={() => setSelectedDay(null)}
            onChanged={handleChanged}
          />
          <EnviadosTable rows={envios.data?.enviados ?? []} loading={carregando} error={envios.error} instancias={lista} />
          <CalendarioDisparos instancias={lista} selectedDay={selectedDay} onSelectDay={setSelectedDay} refreshKey={refreshKey} />
        </div>
      </div>
    </>
  )
}
