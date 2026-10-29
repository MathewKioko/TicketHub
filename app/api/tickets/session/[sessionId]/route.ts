import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // Determine if this is a Paystack reference or an M-Pesa checkout request ID.
    // Paystack references start with "TICKET_"; M-Pesa IDs are long alphanumeric strings.
    const isPaystackReference = sessionId.startsWith('TICKET_')

    const whereClause = isPaystackReference
      ? { paystackReference: sessionId }
      : { mpesaCheckoutRequestId: sessionId }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        price: true,
        quantity: true,
        status: true,
        qrCodeImage: true,
        qrCodeData: true,
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            endDate: true,
            venue: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}