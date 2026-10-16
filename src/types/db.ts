/** Tipos das tabelas/views do schema `public` usadas pelo painel. */

export type FollowupStatus = 'nenhum' | 'em_andamento' | 'respondeu' | 'esgotado' | 'encerrado'
export type EnvioStatus = 'pendente' | 'enviado' | 'erro' | 'agendado' | 'cancelado'

export interface Instancia {
  id: number
  nome: string
  instancia: string
  inbox_id: number
  numero: string | null
  status_conexao: string | null
  followup_ativo: boolean
  atualizado_em: string | null
}

export interface Grupo {
  id: number
  instancia: string
  jid: string
  nome: string | null
  participantes: number | null
  ativo: boolean
  oculto: boolean
  atualizado_em: string | null
}

export interface Followup {
  id: number
  conversation_id: number
  contact_id: number | null
  inbox_id: number | null
  instancia: string | null
  etapa: number
  mensagem: string | null
  classificacao: string | null
  chatwoot_message_id: number | null
  enviado_em: string
  respondeu_em: string | null
}

export interface Conversa {
  conversation_id: number
  contact_id: number | null
  inbox_id: number | null
  contato_nome: string | null
  contato_telefone: string | null
  status: string | null
  ultima_msg_de: string | null
  ultima_msg_em: string | null
  ultima_msg_texto: string | null
  followup_etapa: number | null
  followup_status: FollowupStatus | null
  followup_proximo_em: string | null
  followup_motivo: string | null
  criado_em: string | null
  atualizado_em: string | null
}

export interface Envio {
  id: number
  instancia: string
  grupo_jid: string
  grupo_nome: string | null
  imagem_url: string | null
  texto: string | null
  status: EnvioStatus
  erro: string | null
  evolution_message_id: string | null
  criado_em: string
  enviado_em: string | null
  /** ISO UTC; preenchido quando o disparo foi (ou está) agendado */
  agendado_para: string | null
  /** e-mail do usuário que criou o disparo */
  criado_por: string | null
}

export interface FollowupConfig {
  id: number
  ativo: boolean
  /** horas de cada etapa, ex.: [24, 48, 96]; 1 a 5 itens, inteiros >= 1 */
  etapas_horas: number[]
  /** coluna gerada = etapas_horas.length (somente leitura, nunca enviar no update) */
  readonly max_etapas: number
  janela_inicio: number
  janela_fim: number
  timezone: string | null
  atualizado_em: string | null
}

export interface FollowupMetricasView {
  instancia_id: number
  instancia: string
  atendente: string
  followup_ativo: boolean
  leads_em_followup: number
  enviados_etapa1: number
  enviados_etapa2: number
  enviados_etapa3: number
  total_enviados: number
  leads_recuperados: number
  leads_esgotados: number
  leads_em_andamento: number
  taxa_recuperacao_pct: number | null
}

/** Payload enviado ao webhook do n8n de disparo. */
export interface DisparoPayload {
  instancia: string
  grupo_jid: string
  grupo_nome: string
  imagem_url: string | null
  texto: string | null
  /** ISO 8601 em UTC; ausente = enviar agora */
  agendado_para?: string
  /** e-mail do usuário logado */
  criado_por?: string | null
}

/** Resposta do webhook do n8n de disparo. */
export interface DisparoResponse {
  ok: boolean
  envio_id?: number | string | null
  status?: EnvioStatus | string | null
  erro?: string | null
  agendado_para?: string | null
}
