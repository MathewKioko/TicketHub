import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPayment, isValidTicketReference, getInternalWebhookSecret } from '@/lib/paystack'

// Store processed events for idempotency (in-memory for quick lookups)
// In production, consider using Redis for distributed idempotency
const processedEvents = new Map<string, number>()
const MAX_CACHED_EVENTS = 10000

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      processedEvents.delete(key)
    }
  }
  // Keep cache size under control
  if (processedEvents.size > MAX_CACHED_EVENTS) {
    processedEvents.clear()
  }
}, 60 * 60 * 1000) // Run every hour

interface PaystackEvent {
  event: string
  data: {
    id: number
    reference: string
    amount: number
    currency: string
    status: string
    metadata: Record<string, any>
    customer: {
      email: string
      phone: string
    }
    authorization?: {
      bank: string
      card_type: string
      last4: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security: Verify internal secret header
    const internalSecret = request.headers.get('x-internal-secret')
    const expectedSecret = getInternalWebhookSecret()

    if (internalSecret !== expectedSecret) {
      console.warn('Unauthorized webhook attempt detected')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fast ACK: Respond immediately
    // Note: We'll process async after response is sent
    
    let payload: PaystackEvent
    try {
      payload = await request.json()
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError)
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const { event, data } = payload
    const reference = data.reference

    // Validate reference format
    if (!isValidTicketReference(reference)) {
      console.warn('Invalid reference format in webhook:', reference)
      return NextResponse.json({ received: true })
    }

    // Idempotency check: Skip if already processed
    if (processedEvents.has(reference)) {
      console.log('Duplicate webhook event:', reference)
      return NextResponse.json({ received: true, idempotent: true })
    }

    // Only process successful charge events
    if (event !== 'charge.success') {
      console.log('Ignored event type:', event)
      return NextResponse.json({ received: true, event: event })
    }

    // Verify the transaction with Paystack directly (never trust forwarded data)
    try {
      const verification = await verifyPayment({ reference })

      if (!verification.verified) {
        console.warn('Verification failed for reference:', reference)
        return NextResponse.json({ received: true, verified: false })
      }

      // Additional security checks
      if (verification.metadata.app !== 'tickethub') {
        console.warn('Invalid app in webhook metadata:', verification.metadata)
        return NextResponse.json({ received: true, error: 'Invalid app' })
      }

      // Mark as processed immediately (idempotency)
      processedEvents.set(reference, Date.now())

      // Update tickets to confirmed
      const updateResult = await prisma.ticket.updateMany({
        where: {
          paystackReference: reference,
          status: 'PENDING',
        },
        data: {
          status: 'CONFIRMED',
        },
      })

      if (updateResult.count === 0) {
        console.log('No pending tickets found for reference:', reference)
        return NextResponse.json({ received: true, updated: 0 })
      }

      console.log('Webhook processed successfully:', {
        reference,
        updatedCount: updateResult.count,
      })

      // Emit real-time update
      try {
        const tickets = await prisma.ticket.findMany({
          where: { paystackReference: reference },
          select: { eventId: true },
          take: 1,
        })

        if (tickets.length > 0) {
          const { getSocketIO } = await import('@/lib/socket')
          const socketIO = getSocketIO()
          if (socketIO) {
            const eventId = tickets[0].eventId
            const confirmedCount = await prisma.ticket.count({
              where: {
                eventId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              },
            })
            const { emitTicketCountUpdate } = await import('@/lib/socket')
            emitTicketCountUpdate(eventId, confirmedCount)
          }
        }
      } catch (socketError) {
        console.warn('Socket.IO update failed in webhook:', socketError)
      }

      return NextResponse.json({ received: true, updated: updateResult.count })

    } catch (verificationError) {
      console.error('Verification error in webhook:', verificationError)
      // Still ACK to prevent retries, but log the error
      return NextResponse.json({ received: true, error: 'Verification failed' })
    }

  } catch (err: unknown) {
    console.error('Webhook processing error:', err)
    // Still return 200 to prevent Paystack from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: 'paystack-webhook',
    version: '1.0.0',
  })
}
