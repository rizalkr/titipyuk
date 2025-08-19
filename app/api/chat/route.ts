import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

// Build a focused knowledge context from site content (static base, then enriched dynamically)
function buildSiteContext() {
  // Static framing + guardrails
  return `KONTEKS WEBSITE TITIPYUK (STATIS):
Fokus: layanan penitipan barang aman & fleksibel.
Proses inti: daftar -> login -> buat booking (input jenis barang normal/fragile, berat, dimensi, tanggal) -> checkout & bayar -> dapat password pengambilan.
Harga contoh umum (bisa berubah): Kotak Kecil ~25K/bln, Sedang 45K/bln, Besar 75K/bln.
Aturan fragile: +50% dari harga normal.
Gaya bahasa: santai, ramah anak muda, Bahasa Indonesia non-formal sopan.
Batasan keras: Jawab HANYA soal TitipYuk (penitipan barang, proses, harga, status, istilah internal). Jika pertanyaan di luar konteks (politik, coding umum, hal pribadi sensitif, dsb) respon singkat ajak balik ke topik penitipan.
Jangan mengarang fakta di luar data yang diberikan. Jika tidak yakin, minta user klarifikasi.
`}

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

// Simple in-memory cache for dynamic context to reduce DB hits (ephemeral per server instance)
let dynamicCache: { text: string; ts: number } | null = null
const DYNAMIC_CACHE_TTL_MS = 60_000 // 1 minute

async function buildDynamicContext(supabase: ReturnType<typeof createSupabaseForServer>) {
  const now = Date.now()
  if (dynamicCache && (now - dynamicCache.ts) < DYNAMIC_CACHE_TTL_MS) {
    return dynamicCache.text
  }

  try {
    // Fetch box types (adjust column names if different in schema)
    const { data: boxTypes } = await supabase
      .from('box_types')
      .select('id,name,monthly_price')
      .limit(10)

    // Fetch a few active locations
    const { data: locations } = await supabase
      .from('storage_locations')
      .select('id,name,address')
      .limit(5)

    const formatIDR = (v: any) => {
      const num = Number(v)
      if (isNaN(num)) return v
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
    }

    const boxPart = boxTypes && boxTypes.length
      ? 'Daftar harga box (dinamis):\n' + boxTypes.map(b => `- ${b.name}: ${formatIDR(b.monthly_price)}/bulan (id:${b.id})`).join('\n')
      : 'Daftar harga box dinamis tidak tersedia saat ini.'

    const locPart = locations && locations.length
      ? 'Lokasi aktif (dinamis):\n' + locations.map(l => `- ${l.name}${l.address ? ' - ' + l.address : ''}`).join('\n')
      : 'Data lokasi dinamis tidak tersedia.'

    const dynamicText = `KONTEKS DINAMIS (JANGAN DIKARANG):\n${boxPart}\n${locPart}\nJika user tanya harga atau lokasi, gunakan data di atas; jika tidak ada data relevan, jelaskan belum tersedia.`

    dynamicCache = { text: dynamicText, ts: now }
    return dynamicText
  } catch (e) {
    console.warn('Failed building dynamic context', e)
    return 'KONTEKS DINAMIS: (gagal memuat, jangan tebak harga/lokasi; sarankan user coba lagi).'
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const userMessages = Array.isArray(body.messages) ? body.messages : []
    const conversationId = body.conversationId || randomUUID()
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

    // Log latest user message (only the last one user appended)
    const lastUser = [...trimmed].reverse().find(m => m.role === 'user')
    if (lastUser) {
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        user_id: userId || null,
        role: 'user',
        content: String(lastUser.content).slice(0, 4000)
      })
    }

    const siteContext = buildSiteContext()
    const dynamicContext = await buildDynamicContext(supabase)

    const client = new OpenAI({
      apiKey: process.env.LUNOS_API_KEY!,
      baseURL: process.env.LUNOS_BASE_URL || 'https://api.lunos.tech/v1'
    })

    const systemPrompt = `${siteContext}\n${dynamicContext}\n${profileSnippet}`.trim()

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-4o',
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        ...trimmed.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 1500) }))
      ],
      max_tokens: 600,
    })

    const answer = completion.choices[0]?.message || { role: 'assistant', content: 'Maaf, aku lagi nggak bisa jawab.' }

    // Log assistant answer
    if (answer.content) {
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        user_id: userId || null,
        role: 'assistant',
        content: String(answer.content).slice(0, 8000),
        model: 'gpt-4o'
      })
    }

    return NextResponse.json({ reply: answer, usage: completion.usage, conversationId })
  } catch (e: any) {
    console.error('Chat API error:', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
