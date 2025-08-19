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

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').toLowerCase().trim()
    const code = (body.code || '').trim()

    if (!email || !code) return NextResponse.json({ error: 'Email dan kode wajib diisi' }, { status: 400 })

    // Get profile id
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('id, email_verified').eq('email', email).single()
    if (profileErr || !profile) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 400 })
    if (profile.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true })

    // Get latest unused, unexpired OTP for this user/email
    const { data: otps, error: otpErr } = await supabase.from('email_otp_tokens')
      .select('*')
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3)

    if (otpErr) return NextResponse.json({ error: 'Gagal ambil OTP' }, { status: 500 })
    if (!otps || otps.length === 0) return NextResponse.json({ error: 'Kode sudah kadaluarsa / tidak ditemukan' }, { status: 400 })

    // Check attempts threshold
    const activeOtp = otps[0]
    if (activeOtp.attempts >= activeOtp.max_attempts) {
      return NextResponse.json({ error: 'Percobaan verifikasi sudah maksimal. Minta kode baru.' }, { status: 429 })
    }

    const match = await bcrypt.compare(code, activeOtp.code_hash)

    if (!match) {
      // increment attempts
      await supabase.from('email_otp_tokens').update({ attempts: activeOtp.attempts + 1 }).eq('id', activeOtp.id)
      return NextResponse.json({ error: 'Kode salah' }, { status: 400 })
    }

    // Mark used & set profile verified (two operations)
    const { error: usedErr } = await supabase.rpc('mark_email_otp_used', { p_id: activeOtp.id })
    if (usedErr) console.warn('Failed mark used via rpc, fallback update', usedErr)

    await supabase.from('profiles').update({ email_verified: true }).eq('id', profile.id)

    return NextResponse.json({ ok: true, verified: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
