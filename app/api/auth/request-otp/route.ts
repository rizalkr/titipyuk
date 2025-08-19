import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { sendMailryEmail } from '@/lib/mailry'

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
    const { data: profile } = await supabase.from('profiles').select('id, email_verified').eq('email', email).maybeSingle()
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

    // Send via Mailry helper
    let delivered = false
    let sendError: string | undefined
    const haveMailryConfig = !!process.env.MAILRY_API_KEY && !!process.env.MAILRY_SENDER_EMAIL_ID
    if (haveMailryConfig) {
      const res = await sendMailryEmail({
        to: email,
        subject: 'Kode Verifikasi TitipYuk',
        htmlBody: `<p>Halo,<br/>Kode verifikasi kamu: <b>${code}</b><br/>Berlaku 10 menit.<br/><br/>TitipYuk</p>`,
        plainBody: `Kode verifikasi kamu: ${code} (berlaku 10 menit)`
      })
      delivered = res.ok
      if (!res.ok) sendError = res.error || 'Gagal kirim email'
    } else {
      console.warn('Mailry config missing (MAILRY_API_KEY / MAILRY_SENDER_EMAIL_ID), skip send')
    }

    const devExpose = process.env.ALLOW_DEV_OTP_RESPONSE === 'true' && process.env.NODE_ENV !== 'production'
    return NextResponse.json({ ok: true, delivered, ...(sendError ? { sendError } : {}), ...(devExpose ? { devCode: code } : {}) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
