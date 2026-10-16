import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, LogOut, Send } from 'lucide-react'
import { signOut } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Follow-up', icon: LayoutDashboard },
  { to: '/disparo', label: 'Disparo em grupos', icon: Send },
] as const

const ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-100'

export function Sidebar() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    await navigate({ to: '/login' })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-44 flex-col border-r border-white/[0.06] bg-[#0a0a0a]">
      <div className="flex items-center border-b border-white/[0.06] px-4 py-4">
        <img src="/lumix-logo.png" alt="Lumix" className="h-9 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col px-2">
        <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-widest text-gray-500">Menu</div>
        <ul className="space-y-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={ITEM}
                activeProps={{ className: cn(ITEM, 'bg-white/[0.06] text-white') }}
                activeOptions={{ exact: to === '/' }}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-white/[0.06] py-2">
          <button type="button" onClick={() => void handleSignOut()} className={ITEM}>
            <LogOut size={16} className="shrink-0" />
            Sair
          </button>
        </div>
      </nav>
    </aside>
  )
}
