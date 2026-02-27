import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { initializePayment, generateTicketReference, getPaystackPublicKey } from '@/lib/paystack'
import { z } from 'zod'

const initializeSchema = z.object({
  ticketIds: z.array(z.string()).min(1),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketIds, email } = initializeSchema.parse(body)

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

    // Verify user is verified
    const userId = tickets[0].userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { verified: true },
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

    // Prices are in KES - convert to cents (Paystack expects smallest currency unit)
    // For KES: 1 KES = 100 cents
    const amountInCents = Math.round(totalAmount * 100)

    // Generate unique reference
    const reference = generateTicketReference()

    // Get base URL for callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/paystack/verify/${reference}`

    // Initialize Paystack payment
    const payment = await initializePayment({
      email,
      amount: amountInCents,
      reference,
      userId,
      eventId: tickets[0].eventId,
      ticketIds,
      callbackUrl,
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
      console.error('Error initializing Paystack payment:', err.message)
      return NextResponse.json(
        { error: err.message || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    console.error('Error initializing Paystack payment:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
