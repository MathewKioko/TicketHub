import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await requireAuth()

    const tickets = await prisma.ticket.findMany({
      where: {
        stripeSessionId: params.sessionId,
        userId: user.id,
      },
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

