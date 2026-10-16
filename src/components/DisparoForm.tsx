import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CalendarClock, ImagePlus, Send, X } from 'lucide-react'
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
import { GrupoMultiSelect } from '@/components/GrupoMultiSelect'
import { PILL_ACTIVE, PILL_BASE } from '@/components/layout/PeriodFilter'
import { useAuth } from '@/hooks/useAuth'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  countAgendadosProximos,
  enviarDisparo,
  uploadImagemDisparo,
} from '@/hooks/useEnvios'
import { useGrupos } from '@/hooks/useGrupos'
import { isConectada } from '@/hooks/useInstancias'
import { dayKey, formatAgendado, spLocalToUtcIso, todaySP } from '@/lib/dates'
import { formatBytes, formatPhone } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Grupo, Instancia } from '@/types/db'

const LABEL = 'text-xs uppercase tracking-wider text-gray-400'
const FIELD = 'h-10 w-full rounded-lg border-white/10 bg-white/[0.03] text-white lg:h-9 lg:text-sm'
const DATE_FIELD =
  'h-10 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-white tabular-nums [color-scheme:dark] lg:h-9 lg:text-sm'
export const DIALOG = 'rounded-2xl border-white/10 bg-[#111113]'
export const GRADIENT_BTN =
  'bg-gradient-to-r from-[#80d7f8] to-[#e65ff5] font-semibold text-[#0a0a0a] hover:opacity-90 disabled:opacity-40'

const MIN_FUTURO_MS = 5 * 60_000
const LIMITE_CONCENTRACAO = 3
/** Lote com 2+ grupos: começa em ~1 min quando for "Agora"… */
const LOTE_INICIO_MS = 60_000
/** …e escalona os grupos com 30 s entre si. */
const LOTE_PASSO_MS = 30_000

type Quando = 'agora' | 'agendar'

interface DisparoFormProps {
  instancias: Instancia[]
  loadingInstancias?: boolean
  onSent: () => void
}

export function DisparoForm({ instancias, loadingInstancias, onSent }: DisparoFormProps) {
  const { user } = useAuth()
  const conectadas = useMemo(() => instancias.filter(isConectada), [instancias])
  const [instanciaKey, setInstanciaKey] = useState<string>('')
  const [grupoJids, setGrupoJids] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [quando, setQuando] = useState<Quando>('agora')
  const [agData, setAgData] = useState('')
  const [agHora, setAgHora] = useState('')
  const [concentracaoDb, setConcentracaoDb] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [gruposOpen, setGruposOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [progresso, setProgresso] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const instancia = conectadas.find((i) => i.instancia === instanciaKey) ?? null
  const grupos = useGrupos(instancia?.instancia ?? null)
  const gruposVisiveis = useMemo(() => (grupos.data ?? []).filter((g) => g.ativo && !g.oculto), [grupos.data])
  const selecionados = useMemo(
    () => grupoJids.map((jid) => gruposVisiveis.find((g) => g.jid === jid)).filter((g): g is Grupo => !!g),
    [grupoJids, gruposVisiveis],
  )

  // trocar de chat limpa a seleção
  useEffect(() => {
    setGrupoJids([])
  }, [instanciaKey])

  // grupos que deixaram de estar visíveis saem da seleção
  useEffect(() => {
    if (grupos.loading) return
    setGrupoJids((prev) => {
      const next = prev.filter((jid) => gruposVisiveis.some((g) => g.jid === jid))
      return next.length === prev.length ? prev : next
    })
  }, [gruposVisiveis, grupos.loading])

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

  // --- agendamento ----------------------------------------------------------
  const hojeKey = dayKey(todaySP())
  const agendar = quando === 'agendar'
  let agendadoIso: string | null = null
  let agendamentoError: string | null = null
  if (agendar) {
    if (!agData || !agHora) {
      agendamentoError = 'Informe data e hora do agendamento'
    } else {
      try {
        const iso = spLocalToUtcIso(agData, agHora)
        if (new Date(iso).getTime() - Date.now() < MIN_FUTURO_MS) {
          agendamentoError = 'O horário precisa ser pelo menos 5 minutos no futuro'
        } else {
          agendadoIso = iso
        }
      } catch {
        agendamentoError = 'Data ou hora inválida'
      }
    }
  }

  const n = selecionados.length
  const lote = n >= 2
  const textoLimpo = texto.trim()
  const validationError = !instancia
    ? 'Selecione o chat'
    : n === 0
      ? 'Selecione pelo menos um grupo'
      : !file && !textoLimpo
        ? 'Informe uma imagem ou um texto'
        : agendamentoError

  /** Instante-base do lote (ou do agendamento simples). `null` = envio imediato de 1 grupo. */
  function baseIso(): string | null {
    if (agendadoIso) return agendadoIso
    if (lote) return new Date(Date.now() + LOTE_INICIO_MS).toISOString()
    return null
  }

  const concentracaoTotal = concentracaoDb + (lote || agendadoIso ? n : 0)

  function reset() {
    setGrupoJids([])
    setTexto('')
    clearFile()
    setQuando('agora')
    setAgData('')
    setAgHora('')
    setConcentracaoDb(0)
  }

  async function openConfirm() {
    if (!instancia) return
    setConcentracaoDb(0)
    setConfirmOpen(true)
    const base = baseIso()
    if (base) {
      try {
        setConcentracaoDb(await countAgendadosProximos(instancia.instancia, base))
      } catch {
        setConcentracaoDb(0)
      }
    }
  }

  async function handleConfirm() {
    if (!instancia || n === 0) return
    setSending(true)
    setProgresso(null)
    try {
      // imagem sobe uma única vez; a mesma URL vai em todos os POSTs
      const imagem_url = file ? await uploadImagemDisparo(file) : null
      const base = baseIso()
      const baseMs = base ? new Date(base).getTime() : 0
      const comum = {
        instancia: instancia.instancia,
        imagem_url,
        texto: textoLimpo || null,
        criado_por: user?.email ?? null,
      }

      const falhas: string[] = []
      const okJids: string[] = []
      for (let i = 0; i < n; i++) {
        const g = selecionados[i]
        const nome = g.nome ?? g.jid
        if (lote) setProgresso(`Registrando ${i + 1} de ${n}: ${nome}`)
        const agendado_para = base ? new Date(baseMs + (lote ? i * LOTE_PASSO_MS : 0)).toISOString() : undefined
        try {
          const res = await enviarDisparo({
            ...comum,
            grupo_jid: g.jid,
            grupo_nome: nome,
            ...(agendado_para ? { agendado_para } : {}),
          })
          if (res.ok) okJids.push(g.jid)
          else falhas.push(`${nome}${res.erro ? ` (${res.erro})` : ''}`)
        } catch (e) {
          falhas.push(`${nome} (${e instanceof Error ? e.message : String(e)})`)
        }
      }

      const okCount = okJids.length
      if (okCount === n) {
        if (lote) {
          toast.success(`${n} disparos registrados`, {
            description: `Em sequência a partir de ${formatAgendado(base)}, ~30 s entre cada grupo · ${instancia.nome}`,
          })
        } else if (agendadoIso) {
          toast.success(`Disparo agendado para ${formatAgendado(agendadoIso)}`, {
            description: `${selecionados[0].nome ?? selecionados[0].jid} · ${instancia.nome}`,
          })
        } else {
          toast.success('Disparo enviado', {
            description: `${selecionados[0].nome ?? selecionados[0].jid} · ${instancia.nome}`,
          })
        }
        setConfirmOpen(false)
        reset()
      } else if (okCount > 0) {
        toast.warning(`${okCount} de ${n} registrados; falhou: ${falhas.join(', ')}`)
        setConfirmOpen(false)
        // mantém só os grupos que falharam, para tentar de novo
        setGrupoJids((prev) => prev.filter((jid) => !okJids.includes(jid)))
      } else {
        toast.error('Falha no disparo', { description: falhas.join(', ') || 'O webhook retornou erro.' })
      }
      onSent()
    } catch (e) {
      toast.error('Falha no disparo', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSending(false)
      setProgresso(null)
    }
  }

  const confirmBase = baseIso()

  return (
    <Panel>
      <h3 className="text-sm font-semibold text-white">Novo disparo</h3>
      <p className="text-xs text-gray-500">Envia uma imagem e/ou texto para um ou mais grupos do WhatsApp.</p>

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

        {/* Grupos */}
        <div className="space-y-1.5">
          <Label className={LABEL}>Grupos</Label>
          <GrupoMultiSelect
            grupos={gruposVisiveis}
            value={grupoJids}
            onChange={setGrupoJids}
            disabled={!instancia || grupos.loading}
            placeholder={
              !instancia
                ? 'Selecione o chat primeiro'
                : grupos.loading
                  ? 'Carregando grupos…'
                  : gruposVisiveis.length
                    ? 'Selecione os grupos'
                    : 'Nenhum grupo visível'
            }
          />
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
              <img src={preview} alt="Pré-visualização" className="max-h-48 w-full object-contain lg:max-h-56" />
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
              className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 text-xs text-gray-400 transition-colors hover:border-white/30 hover:text-white"
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

        {/* Quando enviar */}
        <div className="space-y-2">
          <Label className={LABEL}>Quando enviar</Label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setQuando('agora')} className={cn(PILL_BASE, quando === 'agora' && PILL_ACTIVE)}>
              <Send size={14} />
              Agora
            </button>
            <button type="button" onClick={() => setQuando('agendar')} className={cn(PILL_BASE, agendar && PILL_ACTIVE)}>
              <CalendarClock size={14} />
              Agendar
            </button>
          </div>
          {agendar && (
            <div className="space-y-1.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="date"
                  value={agData}
                  min={hojeKey}
                  onChange={(e) => setAgData(e.target.value)}
                  aria-label="Data do agendamento"
                  className={cn(DATE_FIELD, 'w-full min-w-0 sm:flex-1')}
                />
                <input
                  type="time"
                  value={agHora}
                  step={300}
                  onChange={(e) => setAgHora(e.target.value)}
                  aria-label="Hora do agendamento"
                  className={cn(DATE_FIELD, 'w-full sm:w-28')}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Horário de Brasília</span>
                {agendamentoError && (agData || agHora) && <span className="text-xs text-[#ef4444]">{agendamentoError}</span>}
              </div>
            </div>
          )}
          {lote && (
            <p className="text-xs text-gray-500">
              Com {n} grupos, os envios saem em sequência (~30 s entre cada){quando === 'agora' ? ', começando em ~1 minuto' : ''}.
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={() => void openConfirm()}
          disabled={!!validationError || sending}
          title={validationError ?? undefined}
          className={cn('h-12 w-full rounded-lg text-sm lg:h-9', GRADIENT_BTN)}
        >
          <Send size={16} />
          {agendar ? 'Agendar envio' : 'Enviar agora'}
          {lote ? ` (${n} grupos)` : ''}
        </Button>
        {validationError && <p className="text-center text-[11px] text-gray-500">{validationError}</p>}
      </div>

      {/* Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !sending && setConfirmOpen(o)}>
        <DialogContent className={`${DIALOG} sm:max-w-md`}>
          <DialogHeader>
            <DialogTitle>{agendadoIso ? 'Confirmar agendamento' : lote ? 'Confirmar disparo em lote' : 'Confirmar disparo'}</DialogTitle>
            <DialogDescription>
              {agendadoIso ? (
                <>
                  Agendar para <span className="font-semibold text-white">{formatAgendado(agendadoIso)}</span> pelo chat{' '}
                  <span className="font-semibold text-white">{instancia?.nome}</span>
                </>
              ) : (
                <>
                  Enviar pelo chat <span className="font-semibold text-white">{instancia?.nome}</span>
                </>
              )}{' '}
              para {n === 1 ? 'o grupo' : `${n} grupos`}:
            </DialogDescription>
          </DialogHeader>

          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
            {selecionados.map((g, i) => (
              <li key={g.jid} className="flex items-center gap-2">
                {lote && <span className="w-4 shrink-0 text-gray-500 tabular-nums">{i + 1}.</span>}
                <span className="min-w-0 truncate text-gray-200" title={g.nome ?? g.jid}>
                  {g.nome ?? g.jid}
                </span>
              </li>
            ))}
          </ul>

          {lote && (
            <p className="text-xs text-gray-400">
              Os envios serão feitos em sequência, com ~30 s entre cada grupo
              {!agendadoIso ? ', começando em ~1 minuto' : ''}.
            </p>
          )}

          {confirmBase && concentracaoTotal >= LIMITE_CONCENTRACAO && (
            <div className="flex gap-2.5 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2.5 text-xs text-[#f59e0b]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                {concentracaoDb > 0 ? (
                  <>
                    Já existem <span className="font-semibold tabular-nums">{concentracaoDb}</span> disparos agendados para este número
                    nesse horário{lote ? <> e esta seleção adiciona mais <span className="font-semibold tabular-nums">{n}</span></> : null}.
                  </>
                ) : (
                  <>
                    Esta seleção agenda <span className="font-semibold tabular-nums">{n}</span> disparos para este número no mesmo horário.
                  </>
                )}{' '}
                Enviar muitos grupos ao mesmo tempo aumenta o risco de bloqueio do WhatsApp.
              </span>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {preview && <img src={preview} alt="Pré-visualização" className="max-h-56 w-full object-contain" />}
            {textoLimpo && (
              <p className="max-h-32 overflow-y-auto px-4 py-3 text-sm whitespace-pre-wrap text-gray-200">{textoLimpo}</p>
            )}
          </div>

          {progresso && <p className="text-xs text-gray-400 tabular-nums">{progresso}</p>}

          <DialogFooter className="rounded-b-2xl">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={sending} className="text-gray-400 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirm()} disabled={sending} className={cn('rounded-lg', GRADIENT_BTN)}>
              {sending
                ? agendadoIso || lote
                  ? 'Registrando…'
                  : 'Enviando…'
                : agendadoIso
                  ? 'Confirmar agendamento'
                  : lote
                    ? `Confirmar ${n} envios`
                    : 'Confirmar envio'}
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
