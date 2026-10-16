import { useEffect, useState } from 'react'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { saveFollowupConfig, useFollowupConfig, type FollowupConfigInput } from '@/hooks/useFollowupConfig'
import { getEtapaColor } from '@/lib/format'

const MAX_ETAPAS = 5
const NOVA_ETAPA_HORAS = 48
const HORAS = Array.from({ length: 24 }, (_, i) => i)

const EMPTY: FollowupConfigInput = {
  ativo: true,
  etapas_horas: [24, 48, 96],
  janela_inicio: 8,
  janela_fim: 20,
}

interface ConfigDialogProps {
  /** chamado após salvar com sucesso (para recarregar métricas) */
  onSaved?: () => void
}

function HoraSelect({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger aria-label={label} className="h-9 w-[88px] rounded-lg border-white/10 bg-white/[0.03] text-sm text-white tabular-nums">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64 rounded-xl border-white/10 bg-[#111113]">
        {HORAS.map((h) => (
          <SelectItem key={h} value={String(h)} className="tabular-nums">
            {String(h).padStart(2, '0')}:00
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ConfigDialog({ onSaved }: ConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const { data, loading, error, reload } = useFollowupConfig()
  const [form, setForm] = useState<FollowupConfigInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setForm({
        ativo: data.ativo,
        etapas_horas: [...data.etapas_horas],
        janela_inicio: data.janela_inicio,
        janela_fim: data.janela_fim,
      })
    }
  }, [data])

  useEffect(() => {
    if (open) {
      setSaveError(null)
      void reload()
    }
  }, [open, reload])

  const etapas = form.etapas_horas

  function setEtapa(i: number, v: number) {
    setForm((f) => ({ ...f, etapas_horas: f.etapas_horas.map((h, j) => (j === i ? v : h)) }))
  }
  function removeEtapa(i: number) {
    setForm((f) => (f.etapas_horas.length <= 1 ? f : { ...f, etapas_horas: f.etapas_horas.filter((_, j) => j !== i) }))
  }
  function addEtapa() {
    setForm((f) => (f.etapas_horas.length >= MAX_ETAPAS ? f : { ...f, etapas_horas: [...f.etapas_horas, NOVA_ETAPA_HORAS] }))
  }

  const etapasValidas = etapas.every((h) => Number.isInteger(h) && h >= 1 && h <= 720)
  const janelaValida = form.janela_inicio < form.janela_fim
  const validationError = !etapasValidas
    ? 'Cada etapa precisa de um número inteiro de horas entre 1 e 720.'
    : !janelaValida
      ? 'O início da janela precisa ser antes do fim.'
      : null

  const totalHoras = etapas.reduce((s, h) => s + (Number.isFinite(h) ? h : 0), 0)
  const dias = (totalHoras / 24).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  async function handleSave() {
    if (validationError) {
      setSaveError(validationError)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await saveFollowupConfig({
        ativo: form.ativo,
        etapas_horas: etapas.map((h) => Math.round(h)),
        janela_inicio: form.janela_inicio,
        janela_fim: form.janela_fim,
      })
      toast.success('Regras do follow-up salvas')
      setOpen(false)
      onSaved?.()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Regras do follow-up"
        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <Settings size={14} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-white/10 bg-[#111113] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Regras do follow-up</DialogTitle>
            <DialogDescription>Quantas mensagens o lead recebe, com que intervalo e em que horário.</DialogDescription>
          </DialogHeader>

          {loading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ) : error ? (
            <p className="text-sm text-[#ef4444]">{error}</p>
          ) : (
            <div className="space-y-5">
              {/* Switch geral */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Follow-up automático ativo</div>
                  <div className="text-xs text-gray-500">Chave geral do envio automático</div>
                </div>
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, ativo: c }))}
                  className="data-[state=checked]:bg-[#80d7f8]!"
                />
              </div>

              {/* Etapas */}
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">Etapas</div>
                <ul className="space-y-2">
                  {etapas.map((h, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <span className="flex w-16 shrink-0 items-center gap-2 text-sm font-medium text-white">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getEtapaColor(i + 1) }} />
                        Etapa {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-xs text-gray-400">
                        após{' '}
                        <span className="font-semibold text-gray-200 tabular-nums">
                          {Number.isFinite(h) ? h : '—'} h
                        </span>{' '}
                        {i === 0 ? 'sem resposta do lead' : 'da etapa anterior'}
                      </span>
                      <div className="relative shrink-0">
                        <Input
                          type="number"
                          min={1}
                          max={720}
                          step={1}
                          value={Number.isFinite(h) ? h : ''}
                          onChange={(e) => setEtapa(i, e.target.value === '' ? NaN : Number(e.target.value))}
                          aria-label={`Horas da etapa ${i + 1}`}
                          className="h-8 w-20 rounded-lg border-white/10 bg-white/[0.03] pr-6 text-sm text-white tabular-nums"
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-gray-500">h</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEtapa(i)}
                        disabled={etapas.length <= 1}
                        aria-label={`Remover etapa ${i + 1}`}
                        className="shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-gray-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={addEtapa}
                  disabled={etapas.length >= MAX_ETAPAS}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  Adicionar etapa
                </button>
              </div>

              {/* Janela */}
              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">Janela de envio</div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>das</span>
                  <HoraSelect label="Início da janela" value={form.janela_inicio} onChange={(v) => setForm((f) => ({ ...f, janela_inicio: v }))} />
                  <span>às</span>
                  <HoraSelect label="Fim da janela" value={form.janela_fim} onChange={(v) => setForm((f) => ({ ...f, janela_fim: v }))} />
                  <span className="text-xs text-gray-500">Horário de Brasília</span>
                </div>
                {!janelaValida && <p className="mt-1.5 text-xs text-[#ef4444]">O início da janela precisa ser antes do fim.</p>}
              </div>

              {/* Resumo */}
              <p className="text-xs text-gray-500">
                O lead recebe até <span className="font-medium text-gray-300 tabular-nums">{etapas.length}</span>{' '}
                {etapas.length === 1 ? 'mensagem' : 'mensagens'} ao longo de ~
                <span className="font-medium text-gray-300 tabular-nums">{dias}</span> {dias === '1,0' ? 'dia' : 'dias'}.
              </p>

              {saveError && (
                <p className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">{saveError}</p>
              )}
            </div>
          )}

          <DialogFooter className="rounded-b-2xl">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || loading || !!error || !!validationError}
              className="rounded-lg bg-[#80d7f8] text-[#0a0a0a] hover:bg-[#9ee1fa]"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
