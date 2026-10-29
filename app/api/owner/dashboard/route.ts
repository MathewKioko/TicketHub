import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/owner/dashboard - Get event owner dashboard stats
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is event owner or organizer
    if (!['EVENT_OWNER', 'ORGANIZER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Event owner access required' }, { status: 403 })
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    const dateFilter: any = { organizerId: currentUser.id }
    if (from) dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(from) }
    if (to) dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(to) }

    // Get owner's events
    const events = await prisma.event.findMany({
      where: { organizerId: currentUser.id },
      select: {
        id: true,
        title: true,
        status: true,
        date: true,
        venue: true,
        totalTickets: true,
        ticketsSold: true,
        totalRevenue: true,
      },
    })

    // Calculate totals
    const totalEvents = events.length
    const publishedEvents = events.filter(e => e.status === 'PUBLISHED').length
    const totalTicketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0)
    const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0)

    // Get recent tickets sold for owner's events
    const eventIds = events.map(e => e.id)
    
    const recentTickets = await prisma.ticket.findMany({
      where: {
        eventId: { in: eventIds },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        event: {
          select: { id: true, title: true },
        },
      },
    })

    // Get sales by event
    const salesByEvent = await Promise.all(
      events.map(async (event) => {
        const ticketCount = await prisma.ticket.count({
          where: { eventId: event.id, status: 'CONFIRMED' },
        })
        const revenue = await prisma.payment.aggregate({
          where: { eventId: event.id, status: 'SUCCESS' },
          _sum: { amount: true },
        })
        return {
          eventId: event.id,
          title: event.title,
          ticketsSold: ticketCount,
          revenue: revenue._sum.amount || 0,
        }
      })
    )

    // Get event owner profile
    const eventOwnerProfile = await prisma.eventOwnerProfile.findUnique({
      where: { userId: currentUser.id },
    })

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        eventOwnerId: currentUser.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get recent payouts
    const recentPayouts = await prisma.payout.findMany({
      where: { eventOwnerId: currentUser.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      stats: {
        totalEvents,
        publishedEvents,
        totalTicketsSold,
        totalRevenue,
        pendingPayouts: eventOwnerProfile?.pendingPayouts || 0,
      },
      events,
      salesByEvent,
      recentTickets,
      eventOwnerProfile,
      pendingPayouts,
      recentPayouts,
    })
  } catch (error) {
    console.error('Event owner dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
