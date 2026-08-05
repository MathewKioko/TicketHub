import { prisma } from './db'
import { sendTicketConfirmationEmail } from './emails'
import { generateTicketPdfBuffer } from './ticket-pdf'

/**
 * Build a human-friendly short ticket id (last 8 chars + check digit style).
 */
export function humanTicketId(id: string): string {
  return `TH-${id.slice(-8).toUpperCase()}`
}

/**
 * Check whether a confirmation email has already been sent for a Paystack
 * reference. Uses the audit_logs resource as a lightweight dedupe store so we
 * don't need a schema migration.
 */
async function hasSentConfirmation(reference: string): Promise<boolean> {
  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: 'ticket_email_sent',
        resource: 'ticket',
        resourceId: reference,
      },
    })
    return !!existing
  } catch (error) {
    console.warn('[ticket-email] dedupe check failed:', error)
    return false
  }
}

async function markSentConfirmation(reference: string, ticketId: string): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'ticket_email_sent',
        resource: 'ticket',
        resourceId: reference,
        details: { ticketId },
      },
    })
  } catch (error) {
    console.warn('[ticket-email] dedupe mark failed:', error)
  }
}

/**
 * Send ticket confirmation email(s) for a Paystack reference.
 * Looks up all confirmed tickets under the reference, generates a branded PDF
 * for the first ticket's attendee, and emails it to the buyer.
 *
 * Idempotent: a confirmation email is only sent once per reference (deduped via
 * audit_logs). Safe to call repeatedly from webhook or verify.
 */
export async function sendTicketsForReference(reference: string) {
  try {
    // Idempotency guard — skip if already sent for this reference.
    if (await hasSentConfirmation(reference)) {
      console.log(`[ticket-email] Confirmation already sent for ${reference}, skipping.`)
      return { sent: false, skipped: true }
    }

    const tickets = await prisma.ticket.findMany({
      where: { paystackReference: reference },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            date: true,
            endDate: true,
            venue: true,
            imageUrl: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (tickets.length === 0) return { sent: false, skipped: false }

    const first = tickets[0]
    const buyerEmail = first.user.email
    const totalQty = tickets.reduce((sum, t) => sum + (t.quantity || 1), 0)
    const totalAmt = tickets.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 1), 0)
    const currency = first.event.currency || 'KES'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const ticketUrl = `${baseUrl}/tickets/${first.id}`

    let pdfBuffer: Uint8Array | undefined
    try {
      const buf = await generateTicketPdfBuffer({
        id: first.id,
        ticketIdHuman: humanTicketId(first.id),
        eventTitle: first.event.title,
        eventDate: new Date(first.event.date).toLocaleDateString('en-KE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventTime: new Date(first.event.date).toLocaleTimeString('en-KE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        venue: first.event.venue,
        attendeeName: first.user.name || 'Guest',
        attendeeEmail: first.user.email,
        quantity: totalQty,
        price: totalAmt / (totalQty || 1),
        currency,
        status: 'CONFIRMED',
        qrCodeDataUrl: first.qrCodeImage || undefined,
      })
      if (buf) pdfBuffer = new Uint8Array(buf)
    } catch (pdfError) {
      console.warn('[ticket-email] PDF generation skipped:', pdfError)
    }

    const sendResult = await sendTicketConfirmationEmail(buyerEmail, {
      ticketId: first.id,
      ticketIdHuman: humanTicketId(first.id),
      eventTitle: first.event.title,
      eventDate: new Date(first.event.date).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      eventTime: new Date(first.event.date).toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      venue: first.event.venue,
      ticketType: tickets[0]?.ticketType || 'REGULAR',
      quantity: totalQty,
      amount: totalAmt,
      currency,
      attendeeName: first.user.name || 'Guest',
      attendeeEmail: first.user.email,
      ticketUrl,
      qrCodeDataUrl: first.qrCodeImage || undefined,
      eventImageUrl: first.event.imageUrl || undefined,
      ...(pdfBuffer ? { pdfBuffer } : {}),
    })

    // Only mark as sent on true success.
    if (sendResult.success) {
      await markSentConfirmation(reference, first.id)
      return { sent: true, to: buyerEmail, count: tickets.length }
    }

    console.warn('[ticket-email] Confirmation send failed:', sendResult.error)
    return { sent: false, skipped: false, error: sendResult.error }
  } catch (error) {
    console.error('[ticket-email] Failed to send confirmation:', error)
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
