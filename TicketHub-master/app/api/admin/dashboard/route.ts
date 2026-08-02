import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/dashboard - Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    const dateFilter: any = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total events
    const totalEvents = await prisma.event.count()

    // Count events by checking if they have certain fields
    // For now just use total events
    const publishedEvents = totalEvents // All events are considered published for now

    // Get total tickets sold
    const totalTicketsSold = await prisma.ticket.count({
      where: { status: 'CONFIRMED' },
    })

    // Get total revenue - sum of all ticket prices for confirmed tickets
    const ticketsWithPrice = await prisma.ticket.findMany({
      where: { status: 'CONFIRMED' },
      select: { price: true },
    })
    const totalRevenue = ticketsWithPrice.reduce((sum, t) => sum + (Number(t.price) || 0), 0)

    // Get platform fees - estimate as 10% of revenue
    const totalPlatformFees = totalRevenue * 0.1

    // Get recent payments - get recent confirmed tickets
    const recentTickets = await prisma.ticket.findMany({
      where: { status: 'CONFIRMED' },
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

    // Format as payments
    const recentPayments = recentTickets.map(t => ({
      id: t.id,
      amount: t.price,
      status: t.status.toLowerCase(),
      createdAt: t.createdAt.toISOString(),
      user: t.user,
      event: t.event,
    }))

    // Get events by just getting all events
    const eventsByStatus = await prisma.event.findMany({
      select: { id: true },
    })
    
    // Group by a simple count
    const statusCounts = [
      { status: 'PUBLISHED', _count: eventsByStatus.length },
      { status: 'DRAFT', _count: 0 },
    ]

    // Get tickets by status
    const ticketsByStatusResult = await prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get top events by revenue
    const topEventsData = await prisma.event.findMany({
      select: { id: true, title: true, basePrice: true },
      take: 5,
    })

    const topEvents = await Promise.all(
      topEventsData.map(async (e) => {
        // Calculate revenue from confirmed tickets
        const tickets = await prisma.ticket.findMany({
          where: { eventId: e.id, status: 'CONFIRMED' },
          select: { price: true },
        })
        const revenue = tickets.reduce((sum: number, t) => sum + (Number(t.price) || 0), 0)
        return {
          eventId: e.id,
          title: e.title,
          revenue,
        }
      })
    )

    return NextResponse.json({
      stats: {
        totalUsers,
        totalEvents,
        publishedEvents,
        totalTicketsSold,
        totalRevenue,
        totalPlatformFees,
      },
      recentPayments,
      recentTickets,
      eventsByStatus: statusCounts,
      ticketsByStatus: ticketsByStatusResult,
      topEvents,
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: errorMessage, stack: errorStack },
      { status: 500 }
    )
  }
}
