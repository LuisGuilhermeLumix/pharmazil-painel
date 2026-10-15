import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Sessão atual do Supabase Auth (null = deslogado). */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, loading, user: session?.user ?? null }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return null
  if (/invalid login credentials/i.test(error.message)) return 'E-mail ou senha inválidos.'
  if (/email not confirmed/i.test(error.message)) return 'E-mail ainda não confirmado.'
  return error.message
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
