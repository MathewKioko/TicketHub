import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // If no userId provided, return empty (no auth means we need userId param)
    if (!userId) {
      return NextResponse.json({ tickets: [] })
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: userId },
      select: {
        id: true,
        status: true,
        price: true,
        quantity: true,
        qrCodeImage: true,
        qrCodeData: true,
        checkedInAt: true,
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
      orderBy: {
        createdAt: 'desc',
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

