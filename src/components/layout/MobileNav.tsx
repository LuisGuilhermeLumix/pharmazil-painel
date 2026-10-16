import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, LogOut, Send } from 'lucide-react'
import { ConfigDialog } from '@/components/ConfigDialog'
import { signOut } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

/** Evento disparado quando as regras do follow-up são salvas (a página escuta e recarrega). */
export const FOLLOWUP_CONFIG_SAVED = 'followup-config-saved'

const tabs = [
  { to: '/', label: 'Follow-up', icon: LayoutDashboard },
  { to: '/disparo', label: 'Disparo', icon: Send },
] as const

/** Header fixo no topo (só < lg). */
export function MobileHeader() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isFollowup = pathname === '/'

  async function handleSignOut() {
    await signOut()
    await navigate({ to: '/login' })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] px-4 lg:hidden">
      <img src="/lumix-logo.png" alt="Lumix" className="h-6 w-auto" />
      <div className="flex items-center gap-1">
        {isFollowup && (
          <ConfigDialog onSaved={() => window.dispatchEvent(new Event(FOLLOWUP_CONFIG_SAVED))} buttonClassName="h-10 w-10" />
        )}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          aria-label="Sair"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}

/** Barra de abas fixa no rodapé (só < lg). */
export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex h-16">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === '/' }}
              className="flex h-full flex-col items-center justify-center gap-1 text-gray-500 transition-colors"
              activeProps={{ className: 'flex h-full flex-col items-center justify-center gap-1 text-[#80d7f8]' }}
            >
              <Icon size={20} />
              <span className={cn('text-[11px] font-medium')}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
