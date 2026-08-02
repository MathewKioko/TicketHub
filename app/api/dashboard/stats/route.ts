import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Force dynamic rendering - this route uses cookies for auth
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const events = await prisma.event.findMany({
      where: { organizerId: user.id },
      include: {
        tickets: {
          where: {
            status: {
              in: ['CONFIRMED', 'CHECKED_IN'],
            },
          },
        },
      },
    })

    const totalEvents = events.length
    const totalRevenue = events.reduce((sum, event) => {
      return sum + event.tickets.reduce((ticketSum, ticket) => ticketSum + ticket.price, 0)
    }, 0)
    const totalTickets = events.reduce((sum, event) => sum + event.tickets.length, 0)
    const upcomingEvents = events.filter(
      event => new Date(event.date) > new Date()
    ).length

    return NextResponse.json({
      totalEvents,
      totalRevenue,
      totalTickets,
      upcomingEvents,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

