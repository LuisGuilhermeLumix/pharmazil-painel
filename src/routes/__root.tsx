import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Página não encontrada</div>
  ),
})

function RootLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  )
}
