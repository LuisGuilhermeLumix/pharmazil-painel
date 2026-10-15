import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { GerenciarGruposDialog } from '@/components/GerenciarGruposDialog'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, enviarDisparo, uploadImagemDisparo } from '@/hooks/useEnvios'
import { useGrupos } from '@/hooks/useGrupos'
import { isConectada } from '@/hooks/useInstancias'
import { formatBytes, formatPhone } from '@/lib/format'
import type { Instancia } from '@/types/db'

const LABEL = 'text-xs uppercase tracking-wider text-gray-400'
const FIELD = 'h-9 w-full rounded-lg border-white/10 bg-white/[0.03] text-sm text-white'
export const DIALOG = 'rounded-2xl border-white/10 bg-[#111113]'

interface DisparoFormProps {
  instancias: Instancia[]
  loadingInstancias?: boolean
  onSent: () => void
}

export function DisparoForm({ instancias, loadingInstancias, onSent }: DisparoFormProps) {
  const conectadas = useMemo(() => instancias.filter(isConectada), [instancias])
  const [instanciaKey, setInstanciaKey] = useState<string>('')
  const [grupoJid, setGrupoJid] = useState<string>('')
  const [texto, setTexto] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [gruposOpen, setGruposOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const instancia = conectadas.find((i) => i.instancia === instanciaKey) ?? null
  const grupos = useGrupos(instancia?.instancia ?? null)
  const gruposVisiveis = useMemo(() => (grupos.data ?? []).filter((g) => g.ativo && !g.oculto), [grupos.data])
  const grupo = gruposVisiveis.find((g) => g.jid === grupoJid) ?? null

  useEffect(() => {
    if (grupoJid && !gruposVisiveis.some((g) => g.jid === grupoJid)) setGrupoJid('')
  }, [gruposVisiveis, grupoJid])

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function pickFile(f: File | null) {
    if (!f) {
      setFile(null)
      return
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      toast.error('Formato inválido', { description: 'Use JPG, PNG ou WEBP.' })
      return
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error('Imagem muito grande', { description: `Máximo de 10 MB (arquivo tem ${formatBytes(f.size)}).` })
      return
    }
    setFile(f)
  }

  function clearFile() {
    setFile(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const textoLimpo = texto.trim()
  const validationError = !instancia
    ? 'Selecione o chat'
    : !grupo
      ? 'Selecione o grupo'
      : !file && !textoLimpo
        ? 'Informe uma imagem ou um texto'
        : null

  function reset() {
    setGrupoJid('')
    setTexto('')
    clearFile()
  }

  async function handleConfirm() {
    if (!instancia || !grupo) return
    setSending(true)
    try {
      const imagem_url = file ? await uploadImagemDisparo(file) : null
      const res = await enviarDisparo({
        instancia: instancia.instancia,
        grupo_jid: grupo.jid,
        grupo_nome: grupo.nome ?? grupo.jid,
        imagem_url,
        texto: textoLimpo || null,
      })
      if (res.ok) {
        toast.success('Disparo enviado', {
          description: `${grupo.nome ?? grupo.jid} · ${instancia.nome}${res.status ? ` · ${res.status}` : ''}`,
        })
        setConfirmOpen(false)
        reset()
        onSent()
      } else {
        toast.error('Falha no disparo', { description: res.erro ?? 'O webhook retornou erro.' })
        onSent()
      }
    } catch (e) {
      toast.error('Falha no disparo', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <Panel>
      <h3 className="text-sm font-semibold text-white">Novo disparo</h3>
      <p className="text-xs text-gray-500">Envia uma imagem e/ou texto para um grupo do WhatsApp.</p>

      <div className="mt-5 space-y-4">
        {/* Chat */}
        <div className="space-y-1.5">
          <Label className={LABEL}>Chat (atendente)</Label>
          {loadingInstancias ? (
            <Skeleton className="h-9 w-full rounded-lg bg-white/5" />
          ) : (
            <Select value={instanciaKey} onValueChange={setInstanciaKey}>
              <SelectTrigger className={FIELD}>
                <SelectValue placeholder={conectadas.length ? 'Selecione o chat' : 'Nenhum chat conectado'} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#111113]">
                {conectadas.map((i) => (
                  <SelectItem key={i.id} value={i.instancia}>
                    <span className="flex items-center gap-2">
                      <span>{i.nome}</span>
                      <span className="text-xs text-gray-500 tabular-nums">{formatPhone(i.numero)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Grupo */}
        <div className="space-y-1.5">
          <Label className={LABEL}>Grupo</Label>
          <Select value={grupoJid} onValueChange={setGrupoJid} disabled={!instancia || grupos.loading}>
            <SelectTrigger className={FIELD}>
              <SelectValue
                placeholder={
                  !instancia
                    ? 'Selecione o chat primeiro'
                    : grupos.loading
                      ? 'Carregando grupos…'
                      : gruposVisiveis.length
                        ? 'Selecione o grupo'
                        : 'Nenhum grupo visível'
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-[#111113]">
              {gruposVisiveis.map((g) => (
                <SelectItem key={g.id} value={g.jid}>
                  {g.nome ?? g.jid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {instancia && (
            <button
              type="button"
              onClick={() => setGruposOpen(true)}
              className="text-xs text-gray-500 underline-offset-2 hover:text-[#80d7f8] hover:underline"
            >
              Gerenciar grupos
            </button>
          )}
        </div>

        {/* Imagem */}
        <div className="space-y-1.5">
          <Label className={LABEL}>
            Imagem <span className="normal-case tracking-normal text-gray-600">(opcional)</span>
          </Label>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <img src={preview} alt="Pré-visualização" className="max-h-56 w-full object-contain" />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-2 right-2 rounded-lg bg-black/70 p-1 text-gray-300 hover:text-white"
                aria-label="Remover imagem"
              >
                <X size={16} />
              </button>
              <div className="truncate border-t border-white/10 px-3 py-1.5 text-[11px] text-gray-400">
                {file?.name} · {file ? formatBytes(file.size) : ''}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-xs text-gray-400 transition-colors hover:border-white/30 hover:text-white"
            >
              <ImagePlus size={20} />
              <span>Clique para escolher (JPG, PNG ou WEBP · até 10 MB)</span>
            </button>
          )}
        </div>

        {/* Texto */}
        <div className="space-y-1.5">
          <Label htmlFor="texto" className={LABEL}>
            Texto{' '}
            <span className="normal-case tracking-normal text-gray-600">(opcional{file ? ' · vai como legenda' : ''})</span>
          </Label>
          <Textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder="Escreva a mensagem…"
            className="resize-y rounded-lg border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-gray-600"
          />
        </div>

        <Button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!!validationError || sending}
          title={validationError ?? undefined}
          className="h-9 w-full rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
        >
          <Send size={16} />
          Enviar
        </Button>
        {validationError && <p className="text-center text-[11px] text-gray-500">{validationError}</p>}
      </div>

      {/* Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !sending && setConfirmOpen(o)}>
        <DialogContent className={`${DIALOG} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle>Confirmar disparo</DialogTitle>
            <DialogDescription>
              Enviar para <span className="font-semibold text-white">{grupo?.nome ?? grupo?.jid}</span> pelo chat{' '}
              <span className="font-semibold text-white">{instancia?.nome}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {preview && <img src={preview} alt="Pré-visualização" className="max-h-64 w-full object-contain" />}
            {textoLimpo && (
              <p className="max-h-40 overflow-y-auto px-4 py-3 text-sm whitespace-pre-wrap text-gray-200">{textoLimpo}</p>
            )}
          </div>

          <DialogFooter className="rounded-b-2xl">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={sending} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirm()} disabled={sending} className="rounded-lg bg-[#f97316] text-white hover:bg-[#ea580c]">
              {sending ? 'Enviando…' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {instancia && (
        <GerenciarGruposDialog
          open={gruposOpen}
          onOpenChange={setGruposOpen}
          instanciaNome={instancia.nome}
          grupos={grupos.data ?? []}
          loading={grupos.loading}
          onChange={(id, oculto) =>
            grupos.setData((prev) => (prev ? prev.map((g) => (g.id === id ? { ...g, oculto } : g)) : prev))
          }
        />
      )}
    </Panel>
  )
}
