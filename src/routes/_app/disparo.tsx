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

  return (
    <>
      <PageHeader title="Disparo em grupos" subtitle="Envie imagem e texto para os grupos do WhatsApp de cada chat" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <DisparoForm instancias={lista} loadingInstancias={instancias.loading} onSent={handleChanged} />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <EnviadosTable
              rows={envios.data?.enviados ?? []}
              loading={envios.loading && !envios.data}
              error={envios.error}
              instancias={lista}
            />
            <AgendadosTable
              rows={envios.data?.agendados ?? []}
              loading={envios.loading && !envios.data}
              error={envios.error}
              instancias={lista}
              filterDay={selectedDay}
              onClearFilter={() => setSelectedDay(null)}
              onChanged={handleChanged}
            />
          </div>
          <CalendarioDisparos
            instancias={lista}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </>
  )
}
