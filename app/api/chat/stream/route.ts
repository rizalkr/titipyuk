import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

function buildSiteContext() {
  return `KONTEKS TITIPYUK (STREAM): Jawab hanya terkait penitipan TitipYuk, gaya santai, jangan keluar topik.`
}

function createSupabaseForServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set() {}, remove() {} } }
  )
}

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const userMessages = Array.isArray(body.messages) ? body.messages : []
    const conversationId = body.conversationId || randomUUID()

    const supabase = createSupabaseForServer()
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id

    let profileSnippet = ''
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
      if (profile?.full_name) profileSnippet = `Nama user: ${profile.full_name}`
    }

    // Log user message (last)
    const lastUser = [...userMessages].reverse().find(m => m.role === 'user')
    if (lastUser) {
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        user_id: userId || null,
        role: 'user',
        content: String(lastUser.content).slice(0, 4000)
      })
    }

    const client = new OpenAI({
      apiKey: process.env.LUNOS_API_KEY!,
      baseURL: process.env.LUNOS_BASE_URL || 'https://api.lunos.tech/v1'
    })

    const systemPrompt = `${buildSiteContext()}\n${profileSnippet}`.trim()

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      stream: true,
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        ...userMessages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) }))
      ],
      max_tokens: 600,
    } as any)

    const encoder = new TextEncoder()
    let collected = ''

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of response as any) {
            const delta = part?.choices?.[0]?.delta?.content
            if (delta) {
              collected += delta
              controller.enqueue(encoder.encode(delta))
            }
          }
          // Log assistant full answer after stream ends
          if (collected) {
            await supabase.from('chat_messages').insert({
              conversation_id: conversationId,
              user_id: userId || null,
              role: 'assistant',
              content: collected.slice(0, 8000),
              model: 'gpt-4o-mini'
            })
          }
          // Send a terminator JSON meta event (optional) could use SSE; here we ignore.
          controller.close()
        } catch (err: any) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Conversation-Id': conversationId } })
  } catch (e: any) {
    console.error('Stream chat error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
