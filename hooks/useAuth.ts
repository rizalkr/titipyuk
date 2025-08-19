import { useState, useEffect, useTransition } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { serverSignIn, serverSignUp, serverSignOut } from '@/app/actions/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let isMounted = true

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) setLoading(false)
      }
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session)
        setUser(session?.user ?? null)
      }
    })

    return () => { isMounted = false; subscription.unsubscribe() }
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user, session, error } = await serverSignUp(email, password, fullName)
    if (!error && session) {
      // Ensure client supabase stores new session (especially after project switch)
      await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
      setSession(session as any)
      setUser(user as any)
    }
    return { user, error }
  }

  const signIn = async (email: string, password: string) => {
    const { user, session, error } = await serverSignIn(email, password)
    if (!error && session) {
      await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
      setSession(session as any)
      setUser(user as any)
    }
    return { error }
  }

  const signOut = async () => {
    const { error } = await serverSignOut()
    if (!error) {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    }
    return { error }
  }

  return { user, session, loading: loading || isPending, signUp, signIn, signOut }
}
