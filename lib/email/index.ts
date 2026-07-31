import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface SendEmailResult {
  delivered: boolean
  id?: string
  reason?: string
}

const RESEND_URL = 'https://api.resend.com/emails'

export async function getOrganizationEmailSettings(organizationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('organizations')
    .select('name, settings')
    .eq('id', organizationId)
    .single()
  return data as { name: string; settings?: Record<string, unknown> } | null
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not configured — email to', input.to, 'was not delivered.')
    return { delivered: false, reason: 'RESEND_API_KEY not configured' }
  }

  const from = input.from || process.env.RESEND_FROM_EMAIL || 'Demo Corp <onboarding@resend.dev>'

  const attachments = (input.attachments || []).map((a) => ({
    filename: a.filename,
    content: a.content.toString('base64'),
  }))

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  }
  if (input.text) body.text = input.text
  if (input.replyTo) body.reply_to = input.replyTo
  if (attachments.length > 0) body.attachments = attachments

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Resend error ${res.status}: ${detail}`)
    }

    const data = await res.json()
    return { delivered: true, id: data.id }
  } catch (err: any) {
    console.error('[email] send failed:', err.message)
    return { delivered: false, reason: err.message }
  }
}

export function buildInvoiceEmailHtml(opts: {
  orgName: string
  invoiceNumber: string
  clientName: string
  total: string
  currency: string
  status: string
  dueDate?: string | null
  viewUrl?: string
  notes?: string | null
}): string {
  const statusLabel = opts.status.charAt(0).toUpperCase() + opts.status.slice(1)
  return `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;color:#18181b;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;color:#ffffff;padding:24px 32px;">
      <h1 style="margin:0;font-size:18px;">${opts.orgName}</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.7;">Invoice ${opts.invoiceNumber}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;">Hi ${opts.clientName},</p>
      <p style="margin:0 0 24px;">Your invoice <strong>${opts.invoiceNumber}</strong> is attached. Please review the details below.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#71717a;">Invoice #</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;">${opts.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#71717a;border-top:1px solid #f4f4f5;">Status</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;border-top:1px solid #f4f4f5;">${statusLabel}</td>
        </tr>
        ${opts.dueDate ? `<tr><td style="padding:10px 0;color:#71717a;border-top:1px solid #f4f4f5;">Due date</td><td style="padding:10px 0;text-align:right;font-weight:600;border-top:1px solid #f4f4f5;">${opts.dueDate}</td></tr>` : ''}
        <tr>
          <td style="padding:12px 0;color:#71717a;border-top:1px solid #e4e4e7;font-weight:600;">Total</td>
          <td style="padding:12px 0;text-align:right;border-top:1px solid #e4e4e7;font-size:16px;font-weight:700;">${opts.currency} ${opts.total}</td>
        </tr>
      </table>
      ${opts.notes ? `<p style="margin:24px 0 0;font-size:13px;color:#71717a;font-style:italic;">${opts.notes}</p>` : ''}
      ${opts.viewUrl ? `<div style="margin-top:24px;"><a href="${opts.viewUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">View Invoice</a></div>` : ''}
      <p style="margin:32px 0 0;font-size:12px;color:#a1a1aa;">If you have any questions about this invoice, simply reply to this email.</p>
    </div>
  </div>
</body>
</html>`
}

export function buildQuoteEmailHtml(opts: {
  orgName: string
  quoteNumber: string
  clientName: string
  total: string
  currency: string
  status: string
  expiryDate?: string | null
  viewUrl?: string
  notes?: string | null
}): string {
  const statusLabel = opts.status.charAt(0).toUpperCase() + opts.status.slice(1)
  const docLabel = opts.status === 'accepted' ? 'Quote' : 'Estimate'
  return `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f4f4f5;color:#18181b;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;color:#ffffff;padding:24px 32px;">
      <h1 style="margin:0;font-size:18px;">${opts.orgName}</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:.7;">${docLabel} ${opts.quoteNumber}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;">Hi ${opts.clientName},</p>
      <p style="margin:0 0 24px;">Thank you for your interest. Please find your ${docLabel.toLowerCase()} <strong>${opts.quoteNumber}</strong> attached.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:10px 0;color:#71717a;">${docLabel} #</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;">${opts.quoteNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#71717a;border-top:1px solid #f4f4f5;">Status</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;border-top:1px solid #f4f4f5;">${statusLabel}</td>
        </tr>
        ${opts.expiryDate ? `<tr><td style="padding:10px 0;color:#71717a;border-top:1px solid #f4f4f5;">Valid until</td><td style="padding:10px 0;text-align:right;font-weight:600;border-top:1px solid #f4f4f5;">${opts.expiryDate}</td></tr>` : ''}
        <tr>
          <td style="padding:12px 0;color:#71717a;border-top:1px solid #e4e4e7;font-weight:600;">Total</td>
          <td style="padding:12px 0;text-align:right;border-top:1px solid #e4e4e7;font-size:16px;font-weight:700;">${opts.currency} ${opts.total}</td>
        </tr>
      </table>
      ${opts.notes ? `<p style="margin:24px 0 0;font-size:13px;color:#71717a;font-style:italic;">${opts.notes}</p>` : ''}
      ${opts.viewUrl ? `<div style="margin-top:24px;"><a href="${opts.viewUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">View ${docLabel}</a></div>` : ''}
      <p style="margin:32px 0 0;font-size:12px;color:#a1a1aa;">If you have any questions about this ${docLabel.toLowerCase()}, simply reply to this email.</p>
    </div>
  </div>
</body>
</html>`
}
