import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Returns the signed-in user's own tickets. A `userId` query is still accepted
 * for backwards compatibility, but it can only ever match the session user.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestedUserId = request.nextUrl.searchParams.get('userId')
    if (requestedUserId && requestedUserId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: currentUser.id },
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
