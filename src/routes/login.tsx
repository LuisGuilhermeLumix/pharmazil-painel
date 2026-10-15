import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/lumix.svg" alt="Lumix" className="size-12 rounded-2xl" />
          <div>
            <h1 className="text-lg font-semibold text-white">Lumix - Pharmazil</h1>
            <p className="mt-0.5 text-xs text-gray-400">Entre com sua conta para acessar o painel</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-gray-400">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-white/[0.02] text-white placeholder:text-gray-600"
              placeholder="voce@lumixagency.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-gray-400">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/10 bg-white/[0.02] text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#ef4444]">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-[#80d7f8] text-black hover:bg-[#9ee1fa]">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
