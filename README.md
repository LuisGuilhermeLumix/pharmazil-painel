# Painel Pharmazil

Dashboard interno da Lumix Agency para o cliente Pharmazil: acompanhamento do follow-up automático e disparo de mensagens em grupos de WhatsApp.

Front-end apenas. Conversa com um Supabase já existente (tabelas, view, RLS e bucket `pharmazil`) e com o webhook de disparo do n8n.

## Stack

- React 19 + Vite + TypeScript (estrito)
- Tailwind CSS v4 + shadcn/ui
- TanStack Router (rotas por arquivo)
- Recharts
- `@supabase/supabase-js`

## Variáveis de ambiente

Crie um `.env` na raiz (veja `.env.example`):

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<chave publishable/anon>
VITE_N8N_DISPARO_URL=https://<host>/webhook/pharmazil/disparo
```

## Rodando

```
npm install
npm run dev
```

## Build

```
npm run build
```

Saída em `dist/` (site estático). No EasyPanel, use `npm run build` como comando de build e `dist` como diretório de publicação. As variáveis `VITE_*` precisam estar definidas no momento do build.

## Rotas

| Rota       | Descrição                                   |
| ---------- | ------------------------------------------- |
| `/login`   | Login com e-mail e senha (Supabase Auth)    |
| `/`        | Follow-up: métricas, atendentes, gráfico e histórico |
| `/disparo` | Disparo em grupos: formulário e histórico de envios |

Usuários são criados manualmente no painel do Supabase (não há cadastro).
