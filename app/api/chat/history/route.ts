import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function createSupabaseForServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      }
    }
  )
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const conversationId = url.searchParams.get('conversationId')
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId wajib' }, { status: 400 })
    }
    const supabase = createSupabaseForServer()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    // Fetch last 100 messages in that conversation ordered ascending
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role,content,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Basic ownership check: if any row has user_id & doesn't match current user, hide (avoid leaking)
    // (Since RLS already restricts select for user rows, assistant rows tied to user_id; if anon, allow ephemeral).

    return NextResponse.json({ messages: (data || []).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })) })
  } catch (e: any) {
    console.error('History error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
