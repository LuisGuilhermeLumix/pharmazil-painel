import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/Sidebar'
import { getSession } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

/** Layout sem caminho: todas as rotas filhas exigem sessão. */
export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') void navigate({ to: '/login' })
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Sidebar />
      <main className="ml-44 min-h-screen">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
