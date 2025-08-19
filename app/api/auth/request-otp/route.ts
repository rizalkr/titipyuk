import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => cookieStore.get(n)?.value, set() {}, remove() {} } }
  )
}

function generateCode(length = 6) {
  const chars = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').toLowerCase().trim()

    if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

    // Lookup profile
    const { data: profile } = await supabase.from('profiles').select('id, email_verified').eq('email', email).single()
    if (!profile?.id) {
      return NextResponse.json({ error: 'User belum terdaftar' }, { status: 400 })
    }
    if (profile.email_verified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    // Rate limit: last OTP within 60s
    const { data: lastTokens } = await supabase.from('email_otp_tokens')
      .select('id, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
    if (lastTokens && lastTokens.length > 0) {
      const last = new Date(lastTokens[0].created_at).getTime()
      if (Date.now() - last < 60 * 1000) {
        return NextResponse.json({ error: 'Tunggu sebentar sebelum minta kode lagi (maks 1x / 60 detik)' }, { status: 429 })
      }
    }

    const code = generateCode(6)
    const codeHash = await bcrypt.hash(code, 8)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('email_otp_tokens').insert({
      user_id: profile.id,
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
    })

    const MAILRY_KEY = process.env.MAILRY_API_KEY
    if (!MAILRY_KEY) {
      console.warn('MAILRY_API_KEY not set, skipping actual email send')
    } else {
      try {
        await fetch('https://api.mailry.co/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MAILRY_KEY}`,
          },
          body: JSON.stringify({
            to: email,
            subject: 'Kode Verifikasi TitipYuk',
            text: `Kode verifikasi kamu: ${code} (berlaku 10 menit)`,
          })
        })
      } catch (e) {
        console.warn('Failed sending OTP email', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
