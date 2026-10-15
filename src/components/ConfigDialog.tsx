import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { saveFollowupConfig, useFollowupConfig, type FollowupConfigInput } from '@/hooks/useFollowupConfig'

const EMPTY: FollowupConfigInput = {
  ativo: true,
  max_etapas: 3,
  etapa1_horas: 24,
  etapa2_horas: 48,
  etapa3_horas: 72,
  janela_inicio: 8,
  janela_fim: 20,
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-gray-400">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          className="border-white/10 bg-white/[0.02] text-white"
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function ConfigDialog() {
  const [open, setOpen] = useState(false)
  const { data, loading, error, reload } = useFollowupConfig()
  const [form, setForm] = useState<FollowupConfigInput>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setForm({
        ativo: data.ativo,
        max_etapas: data.max_etapas,
        etapa1_horas: data.etapa1_horas,
        etapa2_horas: data.etapa2_horas,
        etapa3_horas: data.etapa3_horas,
        janela_inicio: data.janela_inicio,
        janela_fim: data.janela_fim,
      })
    }
  }, [data])

  useEffect(() => {
    if (open) void reload()
  }, [open, reload])

  const set = <K extends keyof FollowupConfigInput>(k: K, v: FollowupConfigInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  function validate(): string | null {
    const nums: (keyof FollowupConfigInput)[] = [
      'max_etapas',
      'etapa1_horas',
      'etapa2_horas',
      'etapa3_horas',
      'janela_inicio',
      'janela_fim',
    ]
    for (const k of nums) {
      const v = form[k]
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return 'Preencha todos os campos numéricos.'
    }
    if (form.max_etapas < 1 || form.max_etapas > 3) return 'Máx. de etapas deve ser entre 1 e 3.'
    if (form.janela_inicio > 23 || form.janela_fim > 23) return 'A janela deve usar horas entre 0 e 23.'
    return null
  }

  async function handleSave() {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    setSaving(true)
    try {
      await saveFollowupConfig({
        ...form,
        max_etapas: Math.round(form.max_etapas),
        janela_inicio: Math.round(form.janela_inicio),
        janela_fim: Math.round(form.janela_fim),
      })
      toast.success('Regras do follow-up salvas')
      setOpen(false)
    } catch (e) {
      toast.error('Não foi possível salvar', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Regras do follow-up"
        className="border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5 hover:text-white"
      >
        <Settings className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[#111113] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regras do follow-up</DialogTitle>
            <DialogDescription>Define quando e quantas vezes o follow-up automático é enviado.</DialogDescription>
          </DialogHeader>

          {loading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ) : error ? (
            <p className="text-sm text-[#ef4444]">{error}</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">Follow-up ativo</div>
                  <div className="text-xs text-gray-400">Chave geral do envio automático</div>
                </div>
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(c) => set('ativo', c)}
                  className="data-[state=checked]:bg-[#22c55e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumberField id="e1" label="Etapa 1" value={form.etapa1_horas} min={0} suffix="h" onChange={(v) => set('etapa1_horas', v)} />
                <NumberField id="e2" label="Etapa 2" value={form.etapa2_horas} min={0} suffix="h" onChange={(v) => set('etapa2_horas', v)} />
                <NumberField id="e3" label="Etapa 3" value={form.etapa3_horas} min={0} suffix="h" onChange={(v) => set('etapa3_horas', v)} />
              </div>
              <p className="-mt-3 text-xs text-gray-500">Horas após a última mensagem do lead para cada etapa.</p>

              <div className="grid grid-cols-3 gap-3">
                <NumberField id="ji" label="Janela início" value={form.janela_inicio} min={0} max={23} suffix="h" onChange={(v) => set('janela_inicio', v)} />
                <NumberField id="jf" label="Janela fim" value={form.janela_fim} min={0} max={23} suffix="h" onChange={(v) => set('janela_fim', v)} />
                <NumberField id="me" label="Máx. etapas" value={form.max_etapas} min={1} max={3} onChange={(v) => set('max_etapas', v)} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || loading || !!error}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
