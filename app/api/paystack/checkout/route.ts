import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { initializePayment, generateTicketReference, getPaystackPublicKey } from '@/lib/paystack'
import { z } from 'zod'

const checkoutSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ticketIds } = checkoutSchema.parse(body)

    // Verify tickets exist and are pending
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
            basePrice: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (tickets.length !== ticketIds.length) {
      return NextResponse.json(
        { error: 'Invalid tickets - some tickets may not exist or are already confirmed' },
        { status: 400 }
      )
    }

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'No pending tickets found' },
        { status: 400 }
      )
    }

    // Verify user owns the tickets
    if (tickets.some((t) => t.userId !== currentUser.id)) {
      return NextResponse.json(
        { error: 'You do not own these tickets' },
        { status: 403 }
      )
    }

    // Verify user is verified
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { verified: true, email: true, phone: true },
    })

    if (!user?.verified) {
      return NextResponse.json(
        { error: 'User must be verified to purchase tickets' },
        { status: 403 }
      )
    }

    // Calculate total amount
    const totalAmount = tickets.reduce(
      (sum: number, ticket: { price: number }) => sum + ticket.price,
      0
    )

    // Prices are in KES - send directly to Paystack
    const amountInKES = Math.round(totalAmount)

    // Generate unique reference
    const reference = generateTicketReference()

    // Get base URL for callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/tickets/success?reference=${reference}`

    // Initialize Paystack payment
    const payment = await initializePayment({
      email: user.email,
      amount: amountInKES,
      reference,
      userId: currentUser.id,
      eventId: tickets[0].eventId,
      ticketIds,
      callbackUrl,
      metadata: {
        phone: user.phone || '',
        ticketType: tickets[0].event?.title || 'Event Ticket',
      },
    })

    // Update tickets with Paystack reference and access code
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: {
        paystackReference: reference,
        paystackAccessCode: payment.accessCode,
        paymentMethod: 'PAYSTACK',
      },
    })

    // Return the authorization URL to frontend
    return NextResponse.json({
      success: true,
      reference: payment.reference,
      authorizationUrl: payment.authorizationUrl,
      publicKey: getPaystackPublicKey(),
    })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: err.errors },
        { status: 400 }
      )
    }

    if (err instanceof Error) {
      console.error('Error initializing Paystack checkout:', err.message)
      return NextResponse.json(
        { error: err.message || 'Failed to initialize checkout' },
        { status: 500 }
      )
    }

    console.error('Error initializing Paystack checkout:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
