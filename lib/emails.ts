/**
 * Email Notification Service for TicketHub
 * Uses Resend to deliver branded, responsive transactional emails.
 *
 * To activate real delivery:
 *   1. Create a free account at https://resend.com
 *   2. Add RESEND_API_KEY to your .env
 *   3. Add a verified domain + set EMAIL_FROM (e.g. TicketHub <no-reply@tickethub.co.ke>)
 *
 * If RESEND_API_KEY is absent, emails gracefully log to console (no crash).
 */

export type EmailTemplate =
  | 'ticket_confirmation'
  | 'payment_receipt'
| 'event_reminder'
  | 'ticket_refund'
  | 'payout_processed'
  | 'event_cancelled'
  | 'account_verification'
  | 'password_reset'

type EmailData = {
  ticketConfirmation?: {
    ticketId: string
    ticketIdHuman?: string
    eventTitle: string
    eventDate: string
    eventTime?: string
    venue: string
    ticketType: string
    quantity: number
    amount: number
    currency?: string
    attendeeName?: string
    attendeeEmail?: string
    ticketUrl?: string
    qrCodeDataUrl?: string
    pdfBuffer?: Uint8Array
    eventImageUrl?: string
  }
  paymentReceipt?: {
    paymentId: string
    amount: number
    eventTitle: string
    reference: string
  }
  eventReminder?: {
    eventTitle: string
    eventDate: string
    venue: string
    ticketCount: number
  }
  refund?: {
    ticketId: string
    amount: number
    reason?: string
  }
  payout?: {
    amount: number
    bankName: string
    accountNumber: string
  }
  eventCancelled?: {
    eventTitle: string
    reason?: string
  }
  verification?: {
    name: string
    verificationUrl: string
  }
}

async function getResend() {
  try {
    // Dynamic import — resend v4 is ESM-only, so require() will throw.
    const ResendPkg = await import('resend')
    const Resend = ResendPkg.Resend || ResendPkg.default
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return null
    return new Resend(apiKey)
  } catch (error) {
    console.warn('[EMAIL] resend package not available:', error)
    return null
  }
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'TicketHub <onboarding@resend.dev>'

/**
 * Send an email through Resend.
 * Returns { success: false, error } if no API key is configured (graceful log only).
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  data: EmailData,
  subject?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = await getResend()
    const subjectLine = subject || getDefaultSubject(template)
    const { html, text } = renderTemplate(template, data)

    if (!resend) {
      console.log(`[EMAIL][LOG-ONLY] To: ${to} | Subject: ${subjectLine}`)
      console.log(`[EMAIL][LOG-ONLY] HTML length: ${html.length} chars`)
      return {
        success: true,
        messageId: `log_${Date.now()}`,
      }
    }

const attachments: {
      content: string | Buffer
      filename?: string
      contentType?: string
      inlineContentId?: string
    }[] = []

    // Attach the branded PDF ticket (as a regular attachment).
    if (template === 'ticket_confirmation' && data.ticketConfirmation?.pdfBuffer) {
      attachments.push({
        filename: `Ticket-${data.ticketConfirmation.ticketIdHuman || data.ticketConfirmation.ticketId}.pdf`,
        content: Buffer.from(data.ticketConfirmation.pdfBuffer),
      })
    }

    // Attach the QR code as an INLINE attachment (CID) so it renders in the
    // email body on all clients (base64 data URIs are blocked by Gmail etc).
    const qrDataUrl = data.ticketConfirmation?.qrCodeDataUrl
    if (template === 'ticket_confirmation' && qrDataUrl) {
      const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')
      attachments.push({
        filename: 'ticket-qr.png',
        content: Buffer.from(base64, 'base64'),
        contentType: 'image/png',
        inlineContentId: 'ticket-qr-code',
      })
    }

    const payload = {
      from: EMAIL_FROM,
      to,
      subject: subjectLine,
      html,
      text,
      ...(attachments.length > 0 ? { attachments } : {}),
    }

    // Retry transient Resend API failures (e.g. "Unable to fetch data").
    const MAX_ATTEMPTS = 3
    const RETRY_DELAY_MS = 1500

    let lastError: string | undefined

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { error, data: result } = await resend.emails.send(payload)

      if (!error) {
        console.log('[EMAIL] Sent', template, 'to', to, 'id:', result?.id)
        return { success: true, messageId: result?.id }
      }

      lastError = error.message
      const isTransient =
        error.name === 'application_error' ||
        error.name === 'rate_limit_exceeded' ||
        /timeout|unable to fetch|could not be resolved|econnreset|econnrefused|socket/i.test(
          lastError
        )

      if (isTransient && attempt < MAX_ATTEMPTS) {
        console.warn(`[EMAIL] Resend attempt ${attempt}/${MAX_ATTEMPTS} failed (${lastError}). Retrying...`)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
        continue
      }

      console.error('[EMAIL] Resend error:', error)
      return { success: false, error: lastError }
    }

    return { success: false, error: lastError }
  } catch (error) {
    console.error('[EMAIL] Failed to send:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    }
  }
}

function renderTemplate(
  template: EmailTemplate,
  data: EmailData
): { html: string; text: string } {
  switch (template) {
    case 'ticket_confirmation': {
      const t = data.ticketConfirmation!
      const primary = '#D4AF7A'
      const dark = '#0A0A0B'
      const body = '#F5F1E8'
      const muted = '#8A8578'
      const amount = `${t.currency || 'KES'} ${(t.amount * t.quantity).toLocaleString()}`
      const date = `${t.eventDate}${t.eventTime ? ` • ${t.eventTime}` : ''}`

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Ticket</title>
</head>
<body style="margin:0;padding:0;background:${dark};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${dark};padding:28px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#17171A;border:1px solid ${primary}44;border-radius:18px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8C990,#D4AF7A 45%,#B08D57);padding:22px 28px;text-align:center;">
            <span style="font-size:24px;font-weight:800;color:${dark};letter-spacing:1px;">TICKETHUB</span>
            <div style="font-size:11px;color:${dark}aa;letter-spacing:3px;margin-top:2px;">MIDNIGHT LUXE EVENTS</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 6px;color:${body};font-size:22px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">You're going! 🎟️</h1>
            <p style="margin:0 0 18px;color:${muted};font-size:14px;line-height:1.6;">Your ticket has been confirmed. Present the QR code below at the event entrance.</p>

            <div style="border:1px solid ${primary}33;border-radius:14px;padding:18px 20px;margin-bottom:18px;background:${dark}55;">
              <h2 style="margin:0 0 8px;color:${body};font-size:18px;font-family:Georgia,'Times New Roman',serif;">${t.eventTitle}</h2>
              <div style="font-size:13px;color:${body}cc;margin-bottom:4px;">📅 ${date}</div>
              <div style="font-size:13px;color:${body}cc;margin-bottom:4px;">📍 ${t.venue}</div>
              <div style="font-size:13px;color:${body}cc;margin-bottom:4px;">👤 ${t.attendeeName || t.attendeeEmail || ''} ${t.attendeeEmail ? `(${t.attendeeEmail})` : ''}</div>
              <div style="font-size:13px;color:${body}cc;">🎫 ${t.quantity} × ${t.ticketType} — <strong style="color:${primary};">${amount}</strong></div>
            </div>

            ${t.eventImageUrl ? `<img src="${t.eventImageUrl}" width="100%" style="border-radius:12px;margin-bottom:18px;max-height:200px;object-fit:cover;" />` : ''}

${t.qrCodeDataUrl ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#FFFFFF;border-radius:14px;padding:18px;margin-bottom:14px;">
              <img src="cid:ticket-qr-code" width="190" height="190" alt="QR Code" style="display:block;border-radius:4px;" />
              <div style="color:#0A0A0B;font-size:12px;font-weight:700;margin-top:8px;">Scan at the entrance to check in</div>
            </td></tr></table>
            ` : ''}

            ${t.ticketUrl ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="${t.ticketUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8C990,#D4AF7A 45%,#B08D57);color:#0A0A0B;text-decoration:none;padding:13px 26px;border-radius:12px;font-weight:700;font-size:14px;">View My Ticket</a>
            </td></tr></table>
            ` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:18px 28px;border-top:1px solid ${primary}22;text-align:center;">
            <div style="font-size:11px;color:${muted};">Ticket ID: ${t.ticketIdHuman || t.ticketId}</div>
            <div style="font-size:11px;color:${muted};">TicketHub Kenya • Powered by Paystack</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

      const text = `
You're going! 🎟️

Event: ${t.eventTitle}
Date: ${date}
Venue: ${t.venue}
Attendee: ${t.attendeeName || t.attendeeEmail || ''} ${t.attendeeEmail ? `(${t.attendeeEmail})` : ''}
Tickets: ${t.quantity} × ${t.ticketType} — ${amount}
Ticket ID: ${t.ticketIdHuman || t.ticketId}

Present your QR code at the event entrance.
${t.ticketUrl ? `View your ticket: ${t.ticketUrl}` : ''}

TicketHub Kenya • Powered by Paystack
`
      return { html, text }
    }

    case 'payment_receipt': {
      const p = data.paymentReceipt!
      return {
        html: `<div style="background:#0A0A0B;padding:24px;color:#F5F1E8;font-family:Arial,sans-serif;"><div style="max-width:520px;margin:auto;border:1px solid #D4AF7A55;border-radius:16px;padding:24px;"><h2 style="color:#D4AF7A;">Payment Receipt</h2><p style="color:#8A8578;">Referencia: ${p.reference}</p><p style="font-size:24px;font-weight:700;color:#F5F1E8;">KES ${p.amount.toLocaleString()}</p><p style="color:#8A8578;">${p.eventTitle}</p></div></div>`,
        text: `Payment Receipt\nReference: ${p.reference}\nAmount: KES ${p.amount.toLocaleString()}\nEvent: ${p.eventTitle}`,
      }
    }

    case 'password_reset': {
      const v = data.verification!
      const primary = '#D4AF7A'
      const dark = '#0A0A0B'
      const body = '#F5F1E8'
      const muted = '#8A8578'
      const html = `<div style="background:${dark};padding:24px;color:${body};font-family:Arial,sans-serif;"><div style="max-width:520px;margin:auto;border:1px solid ${primary}55;border-radius:16px;padding:24px;"><div style="text-align:center;font-size:22px;font-weight:800;color:${primary};letter-spacing:1px;">TICKETHUB</div><h2 style="color:${body};text-align:center;">Reset Your Password</h2><p style="color:${muted};text-align:center;">Hi ${v.name},<br/>We received a request to reset your password. Click the button below to set a new one.</p><div style="text-align:center;margin:24px 0;"><a href="${v.verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#E8C990,#D4AF7A 45%,#B08D57);color:#0A0A0B;text-decoration:none;padding:13px 26px;border-radius:12px;font-weight:700;font-size:14px;">Reset Password</a></div><p style="color:${muted};text-align:center;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p></div></div>`
      const text = `Reset Your Password\n\nHi ${v.name},\n\nWe received a request to reset your password. Click the link below to set a new one:\n\n${v.verificationUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`
      return { html, text }
    }

    default:
      return {
        html: `<div style="background:#0A0A0B;padding:24px;color:#F5F1E8;font-family:Arial,sans-serif;text-align:center;"><h2 style="color:#D4AF7A;">TicketHub</h2><p>${getDefaultSubject(template)}</p></div>`,
        text: getDefaultSubject(template),
      }
  }
}

function getDefaultSubject(template: EmailTemplate): string {
  switch (template) {
    case 'ticket_confirmation':
      return '🎟️ Your Ticket Confirmation'
    case 'payment_receipt':
      return '💰 Payment Receipt'
    case 'event_reminder':
      return '📅 Event Reminder'
    case 'ticket_refund':
      return '💸 Refund Processed'
    case 'payout_processed':
      return '💵 Payout Processed'
    case 'event_cancelled':
      return '⚠️ Event Cancelled'
case 'account_verification':
      return '✓ Verify Your Account'
    case 'password_reset':
      return '🔑 Reset Your Password'
    default:
      return 'TicketHub Notification'
  }
}

export async function sendTicketConfirmationEmail(
  to: string,
  data: EmailData['ticketConfirmation']
) {
  return sendEmail(to, 'ticket_confirmation', {
    ticketConfirmation: data,
  }, `🎟️ Your Ticket: ${data?.eventTitle}`)
}

export async function sendPaymentReceiptEmail(
  to: string,
  data: EmailData['paymentReceipt']
) {
  return sendEmail(to, 'payment_receipt', {
    paymentReceipt: data,
  }, `💰 Payment Receipt: ${data?.eventTitle}`)
}

export async function sendEventReminderEmail(
  to: string,
  data: EmailData['eventReminder']
) {
  return sendEmail(to, 'event_reminder', {
    eventReminder: data,
  }, `📅 Reminder: ${data?.eventTitle}`)
}

export async function sendRefundEmail(
  to: string,
  data: EmailData['refund']
) {
  return sendEmail(to, 'ticket_refund', {
    refund: data,
  }, '💸 Refund Processed')
}

export async function sendPayoutNotificationEmail(
  to: string,
  data: EmailData['payout']
) {
  return sendEmail(to, 'payout_processed', {
    payout: data,
  }, '💵 Payout Processed')
}

export async function sendEventCancellationEmail(
  to: string,
  data: EmailData['eventCancelled']
) {
  return sendEmail(to, 'event_cancelled', {
    eventCancelled: data,
  }, `⚠️ Event Cancelled: ${data?.eventTitle}`)
}

export async function sendVerificationEmail(
  to: string,
  data: EmailData['verification']
) {
  return sendEmail(to, 'account_verification', {
    verification: data,
  }, '✓ Verify Your Account')
}

export async function sendPasswordResetEmail(
  to: string,
  data: EmailData['verification']
) {
  return sendEmail(to, 'password_reset', {
    verification: data,
  }, '🔑 Reset Your Password')
}

