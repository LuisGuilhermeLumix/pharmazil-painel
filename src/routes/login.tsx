import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSession, signIn } from '@/hooks/useAuth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession()
    if (session) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

const LABEL = 'text-xs uppercase tracking-wider text-gray-400'
const FIELD = 'h-9 rounded-lg border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-gray-600'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email.trim(), password)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    await navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <Panel className="w-[380px] p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src="/lumix-logo.svg"
            alt="Lumix"
            className="h-9 w-auto"
            onError={(e) => {
              // fallback enquanto public/lumix-logo.svg não estiver na pasta
              e.currentTarget.onerror = null
              e.currentTarget.src = '/lumix.svg'
            }}
          />
          <p className="text-xs text-gray-500">Entre com sua conta para acessar o painel</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className={LABEL}>
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
              placeholder="voce@lumixagency.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className={LABEL}>
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="h-9 w-full rounded-lg bg-[#80d7f8] text-[#0a0a0a] hover:bg-[#9ee1fa]">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Panel>
    </div>
  )
}
