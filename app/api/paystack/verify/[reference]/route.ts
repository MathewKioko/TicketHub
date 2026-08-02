import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPayment, isValidTicketReference } from '@/lib/paystack'

// Maximum retries for payment verification
const MAX_RETRIES = 3

interface RouteParams {
  params: Promise<{
    reference: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { reference } = await params

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    // Validate reference format for security
    if (!isValidTicketReference(reference)) {
      return NextResponse.json(
        { error: 'Invalid reference format' },
        { status: 400 }
      )
    }

    // Look up tickets by Paystack reference
    const tickets = await prisma.ticket.findMany({
      where: {
        paystackReference: reference,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            basePrice: true,
          },
        },
      },
    })

    // If no tickets found with this reference
    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'Payment not found', verified: false },
        { status: 404 }
      )
    }

    // Check if already confirmed (idempotent)
    const firstTicket = tickets[0]
    if (firstTicket.status === 'CONFIRMED' || firstTicket.status === 'CHECKED_IN') {
      return NextResponse.json({
        success: true,
        verified: true,
        status: firstTicket.status,
        message: 'Payment already confirmed',
        tickets: tickets.map((t) => ({
          id: t.id,
          status: t.status,
          event: t.event,
        })),
      })
    }

    // Verify with Paystack
    const verification = await verifyPayment({ reference })

    // Validate verification response
    if (!verification.verified) {
      return NextResponse.json({
        success: true,
        verified: false,
        status: verification.status,
        message: 'Payment not successful',
      })
    }

    // Additional security checks
    // Prices are stored in KES - Paystack returns amount in cents
    const expectedAmount = Math.round(firstTicket.price * 100)
    if (verification.amount !== expectedAmount) {
      console.error('Amount mismatch:', {
        expected: expectedAmount,
        actual: verification.amount,
        reference,
      })
      return NextResponse.json(
        { error: 'Payment amount mismatch', verified: false },
        { status: 400 }
      )
    }

    // Verify metadata for routing
    if (verification.metadata.app !== 'tickethub') {
      console.error('Invalid app in metadata:', verification.metadata)
      return NextResponse.json(
        { error: 'Invalid payment destination', verified: false },
        { status: 400 }
      )
    }

    // Update tickets atomically to CONFIRMED
    await prisma.ticket.updateMany({
      where: {
        paystackReference: reference,
        status: 'PENDING', // Only update pending tickets
      },
      data: {
        status: 'CONFIRMED',
      },
    })

    // Get updated tickets
    const updatedTickets = await prisma.ticket.findMany({
      where: {
        paystackReference: reference,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            venue: true,
            basePrice: true,
          },
        },
      },
    })

    // Emit real-time update
    try {
      const { getSocketIO } = await import('@/lib/socket')
      const socketIO = getSocketIO()
      if (socketIO) {
        const eventId = firstTicket.eventId
        const confirmedCount = await prisma.ticket.count({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
        })
        const { emitTicketCountUpdate } = await import('@/lib/socket')
        emitTicketCountUpdate(eventId, confirmedCount)
      }
    } catch (socketError) {
      console.warn('Socket.IO update failed:', socketError)
    }

    console.log('Payment verified successfully:', {
      reference,
      amount: verification.amount,
      ticketCount: updatedTickets.length,
    })

    return NextResponse.json({
      success: true,
      verified: true,
      status: 'CONFIRMED',
      message: 'Payment verified successfully',
      tickets: updatedTickets.map((t) => ({
        id: t.id,
        status: t.status,
        event: t.event,
      })),
    })
  } catch (err: unknown) {
    console.error('Error verifying payment:', err)

    if (err instanceof Error) {
      // Handle specific errors
      if (err.message.includes('Transaction not found')) {
        return NextResponse.json(
          { error: 'Transaction not found', verified: false },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: err.message || 'Verification failed' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
