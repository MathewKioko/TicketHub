import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Lazy import to avoid build-time evaluation
  const { stripe } = await import('@/lib/stripe')
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Check if ticket exists (no auth, verify by sessionId only)
    const ticket = await prisma.ticket.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // If already confirmed, return early
    if (ticket.status === 'CONFIRMED') {
      return NextResponse.json({ confirmed: true })
    }

    // Check Stripe session status
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      if (session.payment_status === 'paid') {
        // Update ticket status to CONFIRMED
        await prisma.ticket.updateMany({
          where: {
            stripeSessionId: sessionId,
            status: 'PENDING',
          },
          data: {
            status: 'CONFIRMED',
            stripePaymentId: session.payment_intent as string,
          },
        })

        return NextResponse.json({ confirmed: true, updated: true })
      } else {
        return NextResponse.json({ confirmed: false, status: session.payment_status })
      }
    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

