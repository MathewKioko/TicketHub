import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const checkoutSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketIds } = checkoutSchema.parse(body)

    // Verify tickets exist and are pending (no auth required)
    const tickets = await prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
        status: 'PENDING',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (tickets.length !== ticketIds.length) {
      return NextResponse.json(
        { error: 'Invalid tickets' },
        { status: 400 }
      )
    }

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'No tickets found' },
        { status: 400 }
      )
    }

    const eventId = tickets[0].eventId
    const totalAmount = tickets.reduce(
      (sum: number, ticket: { price: number }) => sum + ticket.price,
      0
    )

    // Get base URL from environment
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    const baseUrl = envUrl || 'http://localhost:3000'
    const successUrl = `${baseUrl}/tickets/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/tickets/cancel`

    // Lazy import to avoid build-time evaluation
    const { createCheckoutSession } = await import('@/lib/stripe')

    // Get userId from first ticket (all tickets should have same userId)
    const userId = tickets[0]?.userId
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid ticket data' },
        { status: 400 }
      )
    }

    const session = await createCheckoutSession(
      ticketIds,
      eventId,
      userId,
      successUrl,
      cancelUrl,
      tickets.map((t: { id: string; price: number; event: { title: string } }) => ({
        id: t.id,
        price: t.price,
        event: { title: t.event.title },
      }))
    )

    // Update tickets with session ID
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: { stripeSessionId: session.id },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      )
    }

    if (err instanceof Error) {
      console.error('Error creating checkout:', err.message)
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      )
    }

    console.error('Error creating checkout:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}