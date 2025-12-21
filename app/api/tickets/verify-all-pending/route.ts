import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  // Lazy import to avoid build-time evaluation
  const { stripe } = await import('@/lib/stripe')
  try {
    const body = await request.json().catch(() => ({}))
    const userId = body.userId // Optional userId filter

    // Find all PENDING tickets with Stripe session IDs (optionally filtered by userId)
    const whereClause: any = {
      status: 'PENDING',
      stripeSessionId: { not: null },
    }
    if (userId) {
      whereClause.userId = userId
    }

    const pendingTickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        stripeSessionId: true,
      },
    })

    let updated = 0
    let errors = 0

    for (const ticket of pendingTickets) {
      if (!ticket.stripeSessionId) continue

      try {
        const session = await stripe.checkout.sessions.retrieve(ticket.stripeSessionId)

        if (session.payment_status === 'paid') {
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              status: 'CONFIRMED',
              stripePaymentId: session.payment_intent as string,
            },
          })
          updated++
        }
      } catch (error) {
        console.error(`Error verifying ticket ${ticket.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: pendingTickets.length,
    })
  } catch (error) {
    console.error('Error verifying payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

