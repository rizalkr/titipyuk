import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const client = new OpenAI({
      apiKey: process.env.LUNOS_API_KEY!,
      baseURL: process.env.LUNOS_BASE_URL || 'https://api.lunos.tech/v1'
    })

    const systemPrompt = `${buildSiteContext()}\n${profileSnippet}`.trim()

    // Using legacy chat.completions does not support stream in this SDK version reliable on edge; fallback to responses if available
    // We'll attempt using responses API (gpt-4o-mini or similar) for streaming tokens.

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      stream: true,
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        ...userMessages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) }))
      ],
      max_tokens: 600,
    } as any) // casting because stream flag may not be typed on this version

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of response as any) {
            const delta = part?.choices?.[0]?.delta?.content
            if (delta) {
              controller.enqueue(encoder.encode(delta))
            }
          }
          controller.close()
        } catch (err: any) {
          controller.error(err)
        }
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (e: any) {
    console.error('Stream chat error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
