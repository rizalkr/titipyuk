import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Build a focused knowledge context from site content (hardcoded now; could be generated dynamically)
function buildSiteContext() {
  // In real use, fetch and summarize dynamic data (e.g., pricing, features) from DB or files.
  return `KONTEKS WEBSITE TITIPYUK:
Layanan: penitipan barang aman, fleksibel, harga transparan.
Lokasi: Semarang (beberapa lokasi aktif di tabel storage_locations).
Harga contoh (homepage): Kotak Kecil ~25K/bln, Sedang 45K/bln, Besar 75K/bln.
Proses: User daftar -> login -> kalkulator booking (jenis barang normal/fragile, berat, dimensi, tanggal) -> checkout -> pembayaran -> dapat password pengambilan.
Istilah: "titip", "password pengambilan", "booking", "fragile" (barang rapuh +50%).
Gaya bahasa: santai, ramah anak muda, Bahasa Indonesia.
Batasan: Jawab hanya yang relevan dengan TitipYuk (penitipan barang). Jika di luar konteks, minta user fokus ke topik penitipan.
`
}

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const userMessages = Array.isArray(body.messages) ? body.messages : []
    const limit = 12
    const trimmed = userMessages.slice(-limit)

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
      if (profile?.full_name) {
        profileSnippet = `Nama user: ${profile.full_name}`
      }
    }

    // Basic rate limiting (in-memory not persistent; acceptable for demo)
    // Could be replaced with Redis or DB table.

    const siteContext = buildSiteContext()

    const client = new OpenAI({
      apiKey: process.env.LUNOS_API_KEY!,
      baseURL: process.env.LUNOS_BASE_URL || 'https://api.lunos.tech/v1'
    })

    const systemPrompt = `${siteContext}\n${profileSnippet}`.trim()

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      temperature: 0.5,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmed.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) }))
      ],
      max_tokens: 600,
    })

    const answer = completion.choices[0]?.message || { role: 'assistant', content: 'Maaf, aku lagi nggak bisa jawab.' }

    return NextResponse.json({ reply: answer, usage: completion.usage })
  } catch (e: any) {
    console.error('Chat API error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
