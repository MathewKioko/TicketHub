import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const ticketId = params.id

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        userId: true,
        status: true,
        price: true,
        quantity: true,
        qrCodeImage: true,
        qrCodeData: true,
        checkedInAt: true,
        stripeSessionId: true,
        stripePaymentId: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
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

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // If user is logged in, verify they own the ticket or are the organizer
    if (user) {
      if (user.id !== ticket.userId && user.role !== 'ORGANIZER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    // If not logged in, still allow viewing (for QR code scanning from external apps)

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

