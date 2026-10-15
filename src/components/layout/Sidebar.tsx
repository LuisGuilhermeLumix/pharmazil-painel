import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, MessageSquareReply, Send } from 'lucide-react'
import { signOut } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Follow-up', icon: MessageSquareReply },
  { to: '/disparo', label: 'Disparo em grupos', icon: Send },
] as const

export function Sidebar() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    await navigate({ to: '/login' })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/10 bg-[#0b0b0c]">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/lumix.svg" alt="Lumix" className="size-9 rounded-xl" />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Lumix - Pharmazil</div>
          <div className="text-[11px] text-gray-500">Painel interno</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pt-2">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-gray-500">Menu</div>
        <ul className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors',
                  'hover:bg-white/5 hover:text-white',
                )}
                activeProps={{ className: 'bg-white/[0.06] text-white' }}
                activeOptions={{ exact: to === '/' }}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
