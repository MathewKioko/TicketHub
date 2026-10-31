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
            organizerId: true,
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

    // Get organizer's subaccount for revenue split
    const eventOwnerProfile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: tickets[0].event.organizerId },
      select: {
        paystackSubaccountId: true,
        paystackSplitRatio: true,
      },
    })

    // Calculate total amount
    const totalAmount = tickets.reduce(
      (sum: number, ticket: { price: number }) => sum + ticket.price,
      0
    )

    // Prices are in KES - convert to cents (Paystack expects smallest currency unit)
    // For KES: 1 KES = 100 cents
    const amountInCents = Math.round(totalAmount * 100)

    // Calculate platform fee and organizer payout
    const platformFeeRatio = eventOwnerProfile?.paystackSplitRatio ?? 10
    const platformFeeAmount = Math.round((totalAmount * platformFeeRatio) / 100 * 100) / 100 // in KES
    const organizerPayoutAmount = totalAmount - platformFeeAmount

    // Generate unique reference
    const reference = generateTicketReference()

    // Get base URL for callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/tickets/success?reference=${reference}`

    // Prepare metadata for revenue split
    const metadata: Record<string, any> = {
      phone: user.phone || '',
      ticketType: tickets[0].event?.title || 'Event Ticket',
      platformFeeAmount,
      organizerPayoutAmount,
      platformFeeRatio,
    }

    // Add subaccount for automatic split if available
    if (eventOwnerProfile?.paystackSubaccountId) {
      metadata.subaccount = eventOwnerProfile.paystackSubaccountId
    }

    // Initialize Paystack payment
    const payment = await initializePayment({
      email: user.email,
      amount: amountInCents,
      reference,
      userId: currentUser.id,
      eventId: tickets[0].eventId,
      ticketIds,
      callbackUrl,
      metadata,
    })

    // Create Payment record with fee split
    await prisma.payment.create({
      data: {
        userId: currentUser.id,
        eventId: tickets[0].eventId,
        amount: totalAmount,
        currency: 'KES',
        platformFee: platformFeeAmount,
        eventOwnerPayout: organizerPayoutAmount,
        paystackReference: reference,
        status: 'PENDING',
        subaccountId: eventOwnerProfile?.paystackSubaccountId ?? undefined,
        splitRatio: platformFeeRatio,
      },
    })

    // Update tickets with Paystack reference and access code
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: {
        paystackReference: reference,
        paystackAccessCode: payment.accessCode,
        paymentMethod: 'PAYSTACK',
        ticketPrice: tickets[0].price,
      },
    })

    // Return the authorization URL to frontend
    return NextResponse.json({
      success: true,
      reference: payment.reference,
      authorizationUrl: payment.authorizationUrl,
      publicKey: getPaystackPublicKey(),
      feeSplit: {
        platformFee: platformFeeAmount,
        organizerPayout: organizerPayoutAmount,
        platformFeeRatio,
        hasSubaccount: !!eventOwnerProfile?.paystackSubaccountId,
      },
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
