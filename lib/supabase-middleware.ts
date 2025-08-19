import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh / hydrate session (may return stale cached session if project recently switched)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let user = session?.user || null

  // EXTRA VALIDATION: verify user is valid on remote project. If tokens from old project, this will fail.
  if (user) {
    const { data: userCheck, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userCheck?.user) {
      user = null
      // Optional: could clear cookies here if needed (left as-is to avoid side effects per request)
    }
  }

  const protectedPaths = ['/dashboard', '/booking', '/checkout', '/confirmation']
  const authPaths = ['/login', '/signup']
  const currentPath = request.nextUrl.pathname

  const isProtectedPath = protectedPaths.some((path) => currentPath.startsWith(path))
  const isAuthPath = authPaths.includes(currentPath)

  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', currentPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPath && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}
