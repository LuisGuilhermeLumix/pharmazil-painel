const intFormatter = new Intl.NumberFormat('pt-BR')

export function formatInt(n: number | null | undefined): string {
  return intFormatter.format(n ?? 0)
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

/** Formata telefone brasileiro (com ou sem DDI) para leitura. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return '—'
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return raw
}

export function truncate(text: string | null | undefined, max = 60): string {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function pctOf(part: number, total: number): number {
  if (!total) return 0
  return (part / total) * 100
}

/** Nome de arquivo seguro para o Storage (sem extensão). */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const clean = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60)
  return clean || 'imagem'
}

/** Nome curto do atendente para tabelas: remove o sufixo " Pharmazil" ("Thiago Pharmazil" → "Thiago"). */
export function shortName(name: string | null | undefined): string {
  if (!name) return '—'
  return name.replace(/\s+pharmazil\s*$/i, '').trim() || name
}

export const ACCENT_PALETTE = [
  '#80d7f8',
  '#e65ff5',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#a78bfa',
  '#ec4899',
  '#3b82f6',
] as const

/** Cor estável por hash do nome (atendentes, séries, etc.). */
export function getAccentColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return ACCENT_PALETTE[h % ACCENT_PALETTE.length]
}

export const ETAPA_PALETTE = ['#f59e0b', '#3b82f6', '#a78bfa', '#ec4899', '#f97316'] as const

/** Cor da etapa (1-based) pela paleta, por índice. */
export function getEtapaColor(etapa: number): string {
  const i = Math.max(0, Math.round(etapa) - 1)
  return ETAPA_PALETTE[i % ETAPA_PALETTE.length]
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
