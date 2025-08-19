import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function createSupabaseForServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set() {}, remove() {} } }
  )
}

// List distinct conversations with last message preview
export async function GET() {
  try {
    const supabase = createSupabaseForServer()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    if (!userId) return NextResponse.json({ conversations: [] })

    // Ambil gabungan user + assistant message milik user, lalu rangkum unik per conversation_id
    const { data, error } = await supabase
      .from('chat_messages')
      .select('conversation_id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Supabase conversations select error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const seen = new Set<string>()
    const conversations: { conversation_id: string; preview: string; updated_at: string }[] = []
    for (const row of data || []) {
      if (!row.conversation_id) continue
      if (!seen.has(row.conversation_id)) {
        seen.add(row.conversation_id)
        conversations.push({
          conversation_id: row.conversation_id,
          preview: (row.content || 'Percakapan').slice(0, 80),
            updated_at: row.created_at
        })
      }
    }

    return NextResponse.json({ conversations })
  } catch (e: any) {
    console.error('List conversations error', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
