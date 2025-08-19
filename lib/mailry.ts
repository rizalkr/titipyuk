export interface MailrySendParams {
  to: string
  subject: string
  htmlBody?: string
  plainBody?: string
}

export interface MailrySendResult {
  ok: boolean
  status: number
  error?: string
  raw?: any
}

// Sends email via Mailry /ext/inbox/send endpoint
export async function sendMailryEmail(params: MailrySendParams): Promise<MailrySendResult> {
  const apiKey = process.env.MAILRY_API_KEY
  const base = process.env.MAILRY_API_BASE || 'https://api.mailry.co'
  const emailId = process.env.MAILRY_SENDER_EMAIL_ID
  if (!apiKey || !emailId) {
    return { ok: false, status: 400, error: 'Mailry config missing (API key or sender emailId)' }
  }
  try {
    const res = await fetch(`${base}/ext/inbox/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        emailId,
        to: params.to,
        subject: params.subject,
        htmlBody: params.htmlBody,
        plainBody: params.plainBody || params.htmlBody?.replace(/<[^>]+>/g, '') || ''
      })
    })
    if (!res.ok) {
      const txt = await res.text().catch(()=>null)
      return { ok: false, status: res.status, error: txt || 'Mailry send failed' }
    }
    let json: any = null
    try { json = await res.json() } catch {}
    return { ok: true, status: res.status, raw: json }
  } catch (e: any) {
    return { ok: false, status: 500, error: e.message }
  }
}
