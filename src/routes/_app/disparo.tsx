import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DisparoForm } from '@/components/DisparoForm'
import { EnviosTable } from '@/components/EnviosTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { useEnvios } from '@/hooks/useEnvios'
import { useInstancias } from '@/hooks/useInstancias'

export const Route = createFileRoute('/_app/disparo')({
  component: DisparoPage,
})

function DisparoPage() {
  const [page, setPage] = useState(0)
  const instancias = useInstancias()
  const envios = useEnvios(page)

  function handleSent() {
    if (page !== 0) setPage(0)
    else void envios.reload()
  }

  return (
    <>
      <PageHeader title="Disparo em grupos" subtitle="Envie imagem e texto para os grupos do WhatsApp de cada chat" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <DisparoForm
            instancias={instancias.data ?? []}
            loadingInstancias={instancias.loading}
            onSent={handleSent}
          />
        </div>
        <div className="xl:col-span-2">
          <EnviosTable
            page={page}
            data={envios.data}
            loading={envios.loading}
            error={envios.error}
            instancias={instancias.data ?? []}
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  )
}
