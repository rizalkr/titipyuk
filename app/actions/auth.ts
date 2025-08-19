"use server"

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getServerClient() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  return supabase
}

export async function serverSignIn(email: string, password: string) {
  const supabase = getServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data?.user ?? null, session: data?.session ?? null, error }
}

export async function serverSignUp(email: string, password: string, fullName?: string) {
  const supabase = getServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  })
  return { user: data?.user ?? null, session: data?.session ?? null, error }
}

export async function serverSignOut() {
  const supabase = getServerClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}
