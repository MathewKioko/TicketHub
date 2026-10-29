import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * Reconciles the signed-in user's own pending Stripe sessions.
 * The userId in the body is ignored: a caller can only verify their own tickets.
 */
export async function POST(_request: NextRequest) {
  const { stripe } = await import('@/lib/stripe')

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingTickets = await prisma.ticket.findMany({
      where: {
        userId: currentUser.id,
        status: 'PENDING',
        stripeSessionId: { not: null },
      },
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
          updated += 1
        }
      } catch (error) {
        console.error(`Error verifying ticket ${ticket.id}:`, error)
        errors += 1
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
